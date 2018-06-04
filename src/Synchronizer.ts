import { Promise } from "bluebird";
import * as _ from "lodash";

import { Api } from "./api/Api";
import { Protocol } from "./protocol/Protocol";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { SimpleTaker } from "./chainable/Chainable";
import { SteemOperation } from "./blockchain/SteemOperation";
import { SetRules, EffectuatedSetRules, isSetRules } from "./protocol/SetRules";
import { EffectuatedSmartvotesOperation } from "./protocol/EffectuatedSmartvotesOperation";
import { isConfirmVote, ConfirmVote } from "./protocol/ConfirmVote";
import { isSendVoteorder, SendVoteorder } from "./protocol/SendVoteorder";
import { Validator } from "./validation/Validator";
import { ValidationException } from "./validation/ValidationException";
import { SmartvotesOperation } from "./protocol/SmartvotesOperation";

// TODO proper error handling (separate errors that should be reported to ConfirmVotes and Reversible errors [eg. network errors])
export class Synchronizer {
    private timeoutMs = 9000;

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

    public runLoop(since: SteemOperationNumber): Synchronizer {
        this.lastProcessedOperationNum = since;
        this.api.loadAllRulesets(this.delegator, since, this.protocol)
        .then((rules: EffectuatedSetRules []) => {
            this.rules = rules;
            this.processBlock(since.blockNum);
        })
        .catch((error: Error) => {
            this.notifier(error, { type: Synchronizer.EventType.UnhandledError,
                 error: error, moment: this.lastProcessedOperationNum, message: "Unhandled error in synchronizer loop: " + error.message });
        });

        return this;
    }

    public stop(): void {
        this.isRunning = false;
    }

    private processBlock(blockNum: number) {
        this.notify(undefined, { type: Synchronizer.EventType.StartBlockProcessing, blockNum: blockNum, message: "Start processing block " + blockNum });
        this.continueIfRunning(() =>
            Promise.resolve(true)
            .then(() => this.api.getWiseOperationsRelatedToDelegatorInBlock(this.delegator, blockNum, this.protocol))
            .mapSeries((op: EffectuatedSmartvotesOperation) => {
                return this.processOperation(op);
            })
            .timeout(this.timeoutMs, new Error("Timeout (> " + this.timeoutMs + "ms while processing operations)"))
            .then(() => {
                this.notify(undefined, { type: Synchronizer.EventType.EndBlockProcessing, blockNum: blockNum, message: "End processing block " + blockNum });
                this.continueIfRunning(() =>
                    this.processBlock(blockNum + 1)
                );
            }, (error: Error) => {
                this.notify(undefined, { type: Synchronizer.EventType.ReversibleError,
                    error: error, moment: this.lastProcessedOperationNum, message: " Reversible error: " + error.message + ". Retrying in 3 seconds..." });

                this.continueIfRunning(() => setTimeout(() => this.processBlock(blockNum), 3000));
            })
        );
    }

    private processOperation(op: EffectuatedSmartvotesOperation): Promise<void> {
        return new Promise((resolve, reject) => {
            const currentOpNum = op.moment;
            const lastProcessedOperationNum = this.lastProcessedOperationNum;
            this.lastProcessedOperationNum = currentOpNum;

            if (currentOpNum.isLesserOrEqual(lastProcessedOperationNum)) resolve();
            else {
                if (op.delegator === this.delegator) {
                    if (isSetRules(op.command)) this.updateRulesArray(op, op.command).then(() => resolve()).catch((error: Error) => reject(error));
                    else if (isSendVoteorder(op.command)) this.processVoteorder(op, op.command).then(() => resolve()).catch((error: Error) => reject(error));
                    else resolve();
                }
                else resolve();
            }
        });
    }

    private updateRulesArray(op: EffectuatedSmartvotesOperation, cmd: SetRules): Promise<void> {
        return new Promise((resolve, reject) => {
            const es: EffectuatedSetRules = {
                moment: op.moment,
                voter: op.voter,
                rulesets: cmd.rulesets
            };
            this.rules.push(es);
            resolve();
        });
    }

    private processVoteorder(op: EffectuatedSmartvotesOperation, cmd: SendVoteorder): Promise<void> {
        return new Promise((resolve, reject) => {
            const v = new Validator(this.api, this.protocol);
            const rules = this.determineRules(op, cmd);
            if (rules) {
                try {
                    v.provideRulesets(rules);
                    v.validate(this.delegator, op.voter, cmd, op.moment)
                    .then((result: ValidationException | true) => {
                        if (result === true) {
                            this.voteAndConfirm(op, cmd).then(() => resolve()).catch((error: Error) => reject(error));
                        }
                        else {
                            this.rejectVoteorder(op, cmd, (result as ValidationException).message).then(() => resolve()).catch((error: Error) => reject(error));
                        }
                    })
                    .catch((error: Error) => {
                        this.rejectVoteorder(op, cmd, error.message).then(() => resolve()).catch((error: Error) => reject(error));
                    });
                } catch (error) {
                    this.rejectVoteorder(op, cmd, error.message).then(() => resolve()).catch((error: Error) => reject(error));
                }
            }
            else this.rejectVoteorder(op, cmd, "There is no ruleset for you").then(() => resolve()).catch((error: Error) => reject(error));
        });
    }

    private determineRules(op: EffectuatedSmartvotesOperation, cmd: SendVoteorder): EffectuatedSetRules | undefined {
        let out: EffectuatedSetRules | undefined = undefined;
        const moment = op.moment;

        for (let i = 0; i < this.rules.length; i++) {
            const r = this.rules[i];
            if (r.voter === op.voter) {
                if (r.moment.isLesserThan_solveOpInTrxBug(moment)) {
                    if (out && out.moment.isLesserThan_solveOpInTrxBug(r.moment)) {
                        out = r;
                    }
                    else {
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

        this.notify(undefined, { type: Synchronizer.EventType.VoteorderPassed, voteorder: cmd, moment: op.moment, message: "Voteorder passed" });

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

        this.notify(undefined, { type: Synchronizer.EventType.VoteorderRejected, voteorder: cmd, moment: op.moment, message: "Voteorder rejected: " + msg, validationException: undefined });

        return this.api.sendToBlockchain(opsToSend).then((moment: SteemOperationNumber) => {
            this.notify(undefined, { type: Synchronizer.EventType.OperarionsPushed,
            operations: opsToSend, moment: moment, message: "Sent operations to blockchain: " + _.join(opsToSend.map(op => op[0]), ",")});
        });
    }

    private notify(error: Error | undefined, event: Synchronizer.Event) {
        this.notifier(error, event);
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
        SynchronizationStop = "synchronization-stop"

    }

    export type Event = Synchronizer.StartBlockProcessingEvent
                      | Synchronizer.EndBlockProcessingEvent
                      | OperarionsPushedEvent
                      | VoteorderRejected
                      | VoteorderPassed
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

    export interface VoteorderRejected {
        type: EventType.VoteorderRejected;
        voteorder: SendVoteorder;
        moment: SteemOperationNumber;
        validationException: ValidationException | undefined;
        message: string;
    }

    export interface VoteorderPassed {
        type: EventType.VoteorderPassed;
        voteorder: SendVoteorder;
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



interface VoteOperation {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
}