import * as BluebirdPromise from "bluebird";
import * as _ from "lodash";
import * as steem from "steem";

import { Log } from "../log/Log";

import { Api } from "../api/Api";
import { Protocol } from "../protocol/Protocol";
import { SteemOperationNumber } from "steem-efficient-stream";
import { SetRules } from "../protocol/SetRules";
import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";
import { ConfirmVote } from "../protocol/ConfirmVote";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { Validator } from "../validation/Validator";
import { ValidationException } from "../validation/ValidationException";
import { WiseOperation } from "../protocol/WiseOperation";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";

export class LegacySynchronizer {
    private timeoutMs = 12000;
    private protocol: Protocol;
    private api: Api;
    private delegator: string;
    private notifier: Synchronizer.NotifierCallback;

    private isRunning = true;
    private rules: EffectuatedSetRules[] = [];
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
    public start(since: SteemOperationNumber): LegacySynchronizer {
        Log.log().debug("SYNCHRONIZER_RUN_LOOP=" + JSON.stringify({ since: since }));
        this.lastProcessedOperationNum = since;

        (async () => {
            try {
                const rules: EffectuatedSetRules[] = await this.api.loadRulesets({ delegator: this.delegator }, since);

                Log.log().debug("SYNCHRONIZER_INITIAL_RULESETS_LOADED=" + JSON.stringify(rules));
                this.rules = rules;
                this.processBlock(since.blockNum); // the loop is started
            } catch (error) {
                this.notifier(error, {
                    type: Synchronizer.EventType.UnhandledError,
                    error: error,
                    moment: this.lastProcessedOperationNum,
                    message: "Unhandled error in synchronizer loop: " + error.message,
                });
            }
        })();

        return this;
    }

    public stop(): void {
        // when isRunning=false, continueIfRunning() will not call it's callback parameter
        this.isRunning = false;
    }

    private processBlock(blockNum: number) {
        this.notify(undefined, {
            type: Synchronizer.EventType.StartBlockProcessing,
            blockNum: blockNum,
            message: "Start processing block " + blockNum,
        });
        this.continueIfRunning(() =>
            BluebirdPromise.resolve()
                .then(() => this.api.getWiseOperationsRelatedToDelegatorInBlock(this.delegator, blockNum))
                .mapSeries((op: any /* bug in bluebird */) => this.processOperation(op as EffectuatedWiseOperation))
                .timeout(this.timeoutMs, new Error("Timeout (> " + this.timeoutMs + "ms while processing operations)"))
                // when timeout occurs an error is thrown. It is then catched few lines below
                // (already processed operations will not be processed second time, as is described below).
                .then(
                    () => {
                        this.notify(undefined, {
                            type: Synchronizer.EventType.EndBlockProcessing,
                            blockNum: blockNum,
                            message: "End processing block " + blockNum,
                        });
                        this.continueIfRunning(
                            () =>
                                // loop continues only if synchronizer wasn't stopped
                                this.processBlock(blockNum + 1) // loop occurs here through recursion
                        );
                    },
                    (error: Error) => {
                        this.notify(undefined, {
                            type: Synchronizer.EventType.ReversibleError,
                            error: error,
                            moment: this.lastProcessedOperationNum,
                            message: " Reversible error: " + error.message + ". Retrying in 3 seconds...",
                        });
                        // note that operations are processed only if currentOpNum > this.lastProcessedOperationNum,
                        // so if block processing is retried - already processed operations will not be processed second time
                        this.continueIfRunning(() => setTimeout(() => this.processBlock(blockNum), 3000));
                    }
                )
        );
    }

    private async processOperation(op: EffectuatedWiseOperation): Promise<void> {
        const currentOpNum = op.moment;
        if (currentOpNum.isGreaterThan(this.lastProcessedOperationNum)) {
            if (op.delegator === this.delegator) {
                if (SetRules.isSetRules(op.command)) {
                    this.updateRulesArray(op, op.command);
                } else if (SendVoteorder.isSendVoteorder(op.command)) {
                    await this.processVoteorder(op, op.command);
                }
                // confirmVote does not need to be processed
            }
        }
        this.lastProcessedOperationNum = op.moment;
    }

    // update preoaded rules to keep them up-to-date without calling blockchain every voteorder
    private updateRulesArray(op: EffectuatedWiseOperation, cmd: SetRules) {
        const es: EffectuatedSetRules = {
            moment: op.moment,
            voter: op.voter,
            delegator: op.delegator,
            rulesets: cmd.rulesets,
        };
        this.rules.push(es);
        Log.log().debug("SYNCHRONIZER_UPDATED_RULES=" + JSON.stringify(cmd.rulesets));
        this.notify(undefined, {
            type: Synchronizer.EventType.RulesUpdated,
            moment: op.moment,
            message: "Change of rules on blockchain. Local rules were updated.",
        });
    }

    private processVoteorder(op: EffectuatedWiseOperation, cmd: SendVoteorder): Promise<void> {
        Log.log().cheapDebug(() => "SYNCHRONIZER_START_PROCESSING_VOTEORDER= " + JSON.stringify(op));

        const rules = this.determineRules(op, cmd);
        Log.log().cheapDebug(() => "SYNCHRONIZER_DETERMINED_RULES=" + JSON.stringify(rules));

        if (!rules) {
            Log.log().info(
                "@" +
                    op.voter +
                    " tried to vote with ruleset " +
                    '"' +
                    cmd.rulesetName +
                    '", but there are no rulesets for him.'
            );
            return Promise.resolve();
        }

        const v = new Validator(this.api);
        // provide already loaded rulesets (there is no need to call blockchain for them every single voteorder)
        v.provideRulesets(rules);

        return v
            .validate(this.delegator, op.voter, cmd, op.moment)
            .then((result: ValidationException | true) => {
                if (result === true) {
                    return this.voteAndConfirm(op, cmd);
                } else {
                    return this.rejectVoteorder(op, cmd, (result as ValidationException).message);
                }
            })
            .catch((error: Error) => {
                if (error.name === "FetchError") throw error;
                else this.rejectVoteorder(op, cmd, error.message);
            });
    }

    private determineRules(op: EffectuatedWiseOperation, cmd: SendVoteorder): EffectuatedSetRules | undefined {
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

    private voteAndConfirm(op: EffectuatedWiseOperation, cmd: SendVoteorder): Promise<void> {
        Log.log().cheapDebug(() => "SYNCHRONIZER_ACCEPT_VOTEORDER= " + JSON.stringify({ op: op, voteorder: cmd }));

        const opsToSend: steem.OperationWithDescriptor[] = [];

        const confirmCmd: ConfirmVote = {
            voteorderTxId: op.transaction_id,
            accepted: true,
            msg: "",
        };
        const wiseOp: WiseOperation = {
            voter: op.voter,
            delegator: this.delegator,
            command: confirmCmd,
        };
        opsToSend.push(...this.protocol.serializeToBlockchain(wiseOp));

        const voteOp: VoteOperation = {
            voter: this.delegator,
            author: cmd.author,
            permlink: cmd.permlink,
            weight: cmd.weight,
        };

        opsToSend.push(["vote", voteOp]);

        this.notify(undefined, {
            type: Synchronizer.EventType.VoteorderPassed,
            voteorder: cmd,
            voteorderTxId: op.transaction_id,
            moment: op.moment,
            voter: op.voter,
            message: "Voteorder passed",
        });

        return this.api.sendToBlockchain(opsToSend).then((moment: SteemOperationNumber) => {
            this.notify(undefined, {
                type: Synchronizer.EventType.OperarionsPushed,
                operations: opsToSend,
                moment: moment,
                message: "Sent operations to blockchain: " + _.join(opsToSend.map(op => op[0]), ","),
            });
        });
    }

    private rejectVoteorder(op: EffectuatedWiseOperation, cmd: SendVoteorder, msg: string): Promise<void> {
        Log.log().cheapDebug(
            () => "SYNCHRONIZER_REJECT_VOTEORDER= " + JSON.stringify({ op: op, voteorder: cmd, msg: msg })
        );

        const confirmCmd: ConfirmVote = {
            voteorderTxId: op.transaction_id,
            accepted: false,
            msg: msg,
        };
        const wiseOp: WiseOperation = {
            voter: op.voter,
            delegator: this.delegator,
            command: confirmCmd,
        };
        const opsToSend: steem.OperationWithDescriptor[] = this.protocol.serializeToBlockchain(wiseOp);

        this.notify(undefined, {
            type: Synchronizer.EventType.VoteorderRejected,
            voteorder: cmd,
            voteorderTxId: op.transaction_id,
            moment: op.moment,
            voter: op.voter,
            message: "Voteorder rejected: " + msg,
            validationException: undefined,
        });

        return this.api.sendToBlockchain(opsToSend).then((moment: SteemOperationNumber) => {
            this.notify(undefined, {
                type: Synchronizer.EventType.OperarionsPushed,
                operations: opsToSend,
                moment: moment,
                message: "Sent operations to blockchain: " + _.join(opsToSend.map(op => op[0]), ","),
            });
        });
    }

    private async notify(error: Error | undefined, event: Synchronizer.Event) {
        (async () => this.notifier(error, event))();
        if (error) Log.log().error(JSON.stringify(error));
        Log.log().cheapInfo(() => "SYNCHRONIZER_EVENT=" + JSON.stringify(event));
    }

    private continueIfRunning(fn: () => void) {
        if (this.isRunning) fn();
        else {
            this.notify(undefined, {
                type: Synchronizer.EventType.SynchronizationStop,
                moment: this.lastProcessedOperationNum,
                message: "Synchronization stopped",
            });
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
        VoteorderPassed = "voteorder-passed",
        ReversibleError = "reversible-error",
        UnhandledError = "unhandled-error",
        SynchronizationStop = "synchronization-stop",
        RulesUpdated = "rules-updated",
    }

    export type Event =
        | StartBlockProcessingEvent
        | EndBlockProcessingEvent
        | OperarionsPushedEvent
        | VoteorderRejected
        | VoteorderPassed
        | RulesUpdatedEvent
        | ReversibleErrorEvent
        | UnhandledErrorEvent
        | SynchronizationStopEvent;

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
        operations: steem.OperationWithDescriptor[];
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
