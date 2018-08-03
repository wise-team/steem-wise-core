import { Promise } from "bluebird";
import * as _ from "lodash";
import * as _log from "loglevel"; const log = _log.getLogger("steem-wise-core");

import { Api } from "./api/Api";
import { Protocol } from "./protocol/Protocol";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { SetRules, EffectuatedSetRules, isSetRules } from "./protocol/SetRules";
import { EffectuatedSmartvotesOperation } from "./protocol/EffectuatedSmartvotesOperation";
import { ConfirmVote } from "./protocol/ConfirmVote";
import { isSendVoteorder, SendVoteorder } from "./protocol/SendVoteorder";
import { Validator } from "./validation/Validator";
import { ValidationException } from "./validation/ValidationException";
import { SmartvotesOperation } from "./protocol/SmartvotesOperation";

// TODO proper error handling (separate errors that should be reported to ConfirmVotes and Reversible errors [eg. network errors])
export class Synchronizer {
    private timeoutMs = 12000;

    private api: Api;
    private protocol: Protocol;
    private delegator: string;
    private notifier: Synchronizer.NotifierCallback;

    private isRunning = true;
    private rules: EffectuatedSetRules [] = [];
    private lastProcessedOperationNum: SteemOperationNumber = new SteemOperationNumber(0, 0, 0);

    public constructor(api: Api, protocol: Protocol, delegator: string, notifier: Synchronizer.NotifierCallback) {
        this.api = api;
        this.protocol = protocol;
        this.delegator = delegator;
        this.notifier = notifier;
    }

    public setTimeout(timeoutMs: number) {
        this.timeoutMs = timeoutMs;
    }

    // this function only starts the loop via processBlock, which then calls processBlock(blockNum+1)
    public runLoop(since: SteemOperationNumber): Synchronizer {
        log.debug("Synchronizer: Synchronizer.runLoop");
        this.lastProcessedOperationNum = since;
        this.api.loadAllRulesets(this.delegator, since, this.protocol)
        .then((rules: EffectuatedSetRules []) => {
            log.debug("Synchronizer: Loaded all rulesets: " + JSON.stringify(rules, undefined, 2));
            this.rules = rules;
            this.processBlock(since.blockNum); // the loop is started
        })
        .catch((error: Error) => {
            this.notifier(error, { type: Synchronizer.EventType.UnhandledError,
                 error: error, moment: this.lastProcessedOperationNum, message: "Unhandled error in synchronizer loop: " + error.message });
        });

        return this;
    }

    public stop(): void {
        // when isRunning=false, continueIfRunning() will not call it's callback parameter
        this.isRunning = false;
    }

    private processBlock(blockNum: number) {
        this.notify(undefined, { type: Synchronizer.EventType.StartBlockProcessing, blockNum: blockNum, message: "Start processing block " + blockNum });
        this.continueIfRunning(() =>
            Promise.resolve()
            .then(() => this.api.getWiseOperationsRelatedToDelegatorInBlock(this.delegator, blockNum, this.protocol))
            .mapSeries((op: EffectuatedSmartvotesOperation) =>
                this.processOperation(op)
            )
            .timeout(this.timeoutMs, new Error("Timeout (> " + this.timeoutMs + "ms while processing operations)"))
            // when timeout occurs an error is thrown. It is then catched few lines below
            // (already processed operations will not be processed second time, as is described below).
            .then(() => {
                this.notify(undefined, { type: Synchronizer.EventType.EndBlockProcessing, blockNum: blockNum, message: "End processing block " + blockNum });
                this.continueIfRunning(() => // loop continues only if synchronizer wasn't stopped
                    this.processBlock(blockNum + 1) // loop occurs here through recursion
                );
            }, (error: Error) => {
                this.notify(undefined, { type: Synchronizer.EventType.ReversibleError,
                    error: error, moment: this.lastProcessedOperationNum, message: " Reversible error: " + error.message + ". Retrying in 3 seconds..." });
                // note that operations are processed only if currentOpNum > this.lastProcessedOperationNum,
                // so if block processing is retried — already processed operations will not be processed second time
                this.continueIfRunning(() => setTimeout(() => this.processBlock(blockNum), 3000));
            })
        );
    }

    private processOperation(op: EffectuatedSmartvotesOperation): Promise<void> {
        return Promise.resolve().then(() => {
            const currentOpNum = op.moment;
            if (currentOpNum.isGreaterThan(this.lastProcessedOperationNum)) {
                if (op.delegator === this.delegator) {
                    if (isSetRules(op.command)) {
                        return this.updateRulesArray(op, op.command);
                    }
                    else if (isSendVoteorder(op.command)) {
                        return this.processVoteorder(op, op.command);
                    }
                    // confirmVote does not need to be processed
                }
            }
        })
        .then(() => this.lastProcessedOperationNum = op.moment).then(() => {}); // update lastProcessedOperation
    }

    // update preoaded rules to keep them up-to-date without calling blockchain every voteorder
    private updateRulesArray(op: EffectuatedSmartvotesOperation, cmd: SetRules): Promise<void> {
        return Promise.resolve().then(() => {
            const es: EffectuatedSetRules = {
                moment: op.moment,
                voter: op.voter,
                rulesets: cmd.rulesets
            };
            this.rules.push(es);
            log.debug("Synchronizer: Adding new rules encountered on blockchain: " + JSON.stringify(cmd.rulesets, undefined, 2));
            this.notify(undefined, { type: Synchronizer.EventType.RulesUpdated, moment: op.moment,
                message: "Change of rules on blockchain. Local rules were updated." });
        });
    }

    private processVoteorder(op: EffectuatedSmartvotesOperation, cmd: SendVoteorder): Promise<void> {
        log.debug("Synchronizer: Processing voteorder " + JSON.stringify(op, undefined, 2));

        const rules = this.determineRules(op, cmd);
        log.debug("Synchronizer: Determined rules" + JSON.stringify(rules, undefined, 2));

        if (!rules) return this.rejectVoteorder(op, cmd, "There is no ruleset for you");

        const v = new Validator(this.api, this.protocol);
        // provide already loaded rulesets (there is no need to call blockchain for them every single voteorder)
        v.provideRulesets(rules);

        return v.validate(this.delegator, op.voter, cmd, op.moment)
        .then((result: ValidationException | true) => {
            if (result === true) {
                return this.voteAndConfirm(op, cmd);
            }
            else {
                return this.rejectVoteorder(op, cmd, (result as ValidationException).message);
            }
        })
        .catch((error: Error) => {
            if (error.name === "FetchError") throw error;
            else this.rejectVoteorder(op, cmd, error.message);
        });
    }

    private determineRules(op: EffectuatedSmartvotesOperation, cmd: SendVoteorder): EffectuatedSetRules | undefined {
        let out: EffectuatedSetRules | undefined = undefined;
        const moment = op.moment;

        for (let i = 0; i < this.rules.length; i++) {
            const r = this.rules[i];
            if (r.voter === op.voter) {
                if (r.moment.isLesserThan_solveOpInTrxBug(moment)) {
                    if (!out || out.moment.isLesserThan_solveOpInTrxBug(r.moment)) {
                        out = r;
                    }
                }
            }
        }
        return out;
    }

    private voteAndConfirm(op: EffectuatedSmartvotesOperation, cmd: SendVoteorder): Promise<void> {
        const opsToSend: [string, object][] = [];

        const voteOp: VoteOperation = {
            voter: this.delegator,
            author: cmd.author,
            permlink: cmd.permlink,
            weight: cmd.weight
        };

        opsToSend.push(["vote", voteOp]);

        const confirmCmd: ConfirmVote = {
            voteorderTxId: op.transaction_id,
            accepted: true,
            msg: "",
        };
        const wiseOp: SmartvotesOperation = {
            voter: op.voter,
            delegator: this.delegator,
            command: confirmCmd
        };
        opsToSend.push(...this.protocol.serializeToBlockchain(wiseOp));

        this.notify(undefined, { type: Synchronizer.EventType.VoteorderPassed, voteorder: cmd, voteorderTxId: op.transaction_id, moment: op.moment, voter: op.voter, message: "Voteorder passed" });

        return this.api.sendToBlockchain(opsToSend).then((moment: SteemOperationNumber) => {
            this.notify(undefined, { type: Synchronizer.EventType.OperarionsPushed,
            operations: opsToSend, moment: moment, message: "Sent operations to blockchain: " + _.join(opsToSend.map(op => op[0]), ",")});
        });
    }

    private rejectVoteorder(op: EffectuatedSmartvotesOperation, cmd: SendVoteorder, msg: string): Promise<void> {
        const confirmCmd: ConfirmVote = {
            voteorderTxId: op.transaction_id,
            accepted: false,
            msg: msg,
        };
        const wiseOp: SmartvotesOperation = {
            voter: op.voter,
            delegator: this.delegator,
            command: confirmCmd
        };
        const opsToSend: [string, object][] = this.protocol.serializeToBlockchain(wiseOp);

        this.notify(undefined, { type: Synchronizer.EventType.VoteorderRejected, voteorder: cmd, voteorderTxId: op.transaction_id, moment: op.moment, voter: op.voter, message: "Voteorder rejected: " + msg, validationException: undefined });

        return this.api.sendToBlockchain(opsToSend).then((moment: SteemOperationNumber) => {
            this.notify(undefined, { type: Synchronizer.EventType.OperarionsPushed,
            operations: opsToSend, moment: moment, message: "Sent operations to blockchain: " + _.join(opsToSend.map(op => op[0]), ",")});
        });
    }

    private notify(error: Error | undefined, event: Synchronizer.Event) {
        this.notifier(error, event);
        if (error) log.error(JSON.stringify(error));
        else if (log.getLevel() <= log.levels.INFO) {
            log.info(JSON.stringify(event, undefined, 2));
        }
    }

    private continueIfRunning(fn: () => void) {
        if (this.isRunning) fn();
        else {
            this.notify(undefined, { type: Synchronizer.EventType.SynchronizationStop, moment: this.lastProcessedOperationNum, message: "Synchronization stopped" });
        }
    }
}

export namespace Synchronizer {
    export interface NotifierCallback {
        (error: Error | undefined, event: Synchronizer.Event): void;
    }

    export enum EventType {
        StartBlockProcessing = "start-block-processing",
        EndBlockProcessing = "end-block-processing",
        OperarionsPushed = "operations-pushed",
        VoteorderRejected = "voteorder-rejected",
        VoteorderPassed = "voteordr-passed",
        ReversibleError = "reversible-error",
        UnhandledError = "unhandled-error",
        SynchronizationStop = "synchronization-stop",
        RulesUpdated = "rules-updated"

    }

    export type Event = StartBlockProcessingEvent
                      | EndBlockProcessingEvent
                      | OperarionsPushedEvent
                      | VoteorderRejected
                      | VoteorderPassed
                      | RulesUpdatedEvent
                      | ReversibleErrorEvent
                      | UnhandledErrorEvent
                      | SynchronizationStopEvent
                      ;

    export interface StartBlockProcessingEvent {
        type: EventType.StartBlockProcessing;
        blockNum: number;
        message: string;
    }

    export interface EndBlockProcessingEvent {
        type: EventType.EndBlockProcessing;
        blockNum: number;
        message: string;
    }

    export interface OperarionsPushedEvent {
        type: EventType.OperarionsPushed;
        operations: [string, object][];
        moment: SteemOperationNumber;
        message: string;
    }

    export interface RulesUpdatedEvent {
        type: EventType.RulesUpdated;
        moment: SteemOperationNumber;
        message: string;
    }

    export interface VoteorderRejected {
        type: EventType.VoteorderRejected;
        voteorder: SendVoteorder;
        voteorderTxId: string;
        voter: string;
        moment: SteemOperationNumber;
        validationException: ValidationException | undefined;
        message: string;
    }

    export interface VoteorderPassed {
        type: EventType.VoteorderPassed;
        voteorder: SendVoteorder;
        voteorderTxId: string;
        voter: string;
        moment: SteemOperationNumber;
        message: string;
    }

    export interface ReversibleErrorEvent {
        type: EventType.ReversibleError;
        moment: SteemOperationNumber;
        error: Error;
        message: string;
    }

    export interface UnhandledErrorEvent {
        type: EventType.UnhandledError;
        moment: SteemOperationNumber;
        error: Error;
        message: string;
    }

    export interface SynchronizationStopEvent {
        type: EventType.SynchronizationStop;
        moment: SteemOperationNumber;
        message: string;
    }
}

// TODO emit RulesChangedEvent

interface VoteOperation {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
}