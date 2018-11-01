import * as _ from "lodash";
import * as steem from "steem";

import { Log } from "../log/log";

import { Api } from "../api/Api";
import { Protocol } from "../protocol/Protocol";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { SetRules } from "../protocol/SetRules";
import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";
import { ConfirmVote } from "../protocol/ConfirmVote";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { Validator } from "../validation/Validator";
import { ValidationException } from "../validation/ValidationException";
import { WiseOperation } from "../protocol/WiseOperation";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";
import { UniversalSynchronizer } from "./UniversalSynchronizer";

export class SingleDaemon {
    private api: Api;
    private protocol: Protocol;
    private universalSynchronizer: UniversalSynchronizer;
    private delegator: string;
    private notifier: SingleDaemon.NotifierCallback;

    private rules: EffectuatedSetRules [] = [];

    public constructor(api: Api, protocol: Protocol, delegator: string, notifier: SingleDaemon.NotifierCallback) {
        this.api = api;
        this.protocol = protocol;
        this.universalSynchronizer = new UniversalSynchronizer(api, protocol, {
            onSetRules: (setRules, wiseOp) => this.onSetRules(setRules, wiseOp),
            onVoteorder: (voteorder, wiseOp) => this.onVoteorder(voteorder, wiseOp),
            onStart: () => this.onStart(),
            onError:  (error: Error, proceeding: boolean) => this.onError(error, proceeding),
            onFinished: () => this.onFinished(),
            onBlockProcessingStart: (blockNum) => this.onBlockProcessingStart(blockNum),
            onBlockProcessingFinished: (blockNum) => this.onBlockProcessingFinished(blockNum)
        });
        this.delegator = delegator;
        this.notifier = notifier;
    }

    // this function only starts the loop via processBlock, which then calls processBlock(blockNum+1)
    public start(since: SteemOperationNumber): SingleDaemon {

        (async () => {
            const rules: EffectuatedSetRules [] = await this.api.loadRulesets({ delegator: this.delegator }, since);
            Log.log().debug("SYNCHRONIZER_INITIAL_RULESETS_LOADED=" + JSON.stringify(rules));
            this.rules = rules;

            this.universalSynchronizer.start(since);
        })();

        return this;
    }

    public stop(): void {
        this.universalSynchronizer.stop();
    }

    private onStart() {
    }

    private onFinished() {
        this.notify(undefined, {
            type: SingleDaemon.EventType.SynchronizationStop,
            moment: this.universalSynchronizer.getLastProcessedOperation(),
            message: "Synchronization stop"
        });
    }

    private onBlockProcessingStart(blockNum: number) {
        this.notify(undefined, {
            type: SingleDaemon.EventType.StartBlockProcessing, blockNum: blockNum,
            message: "Start processing block " + blockNum
        });
    }

    private onBlockProcessingFinished(blockNum: number) {
        this.notify(undefined, {
            type: SingleDaemon.EventType.EndBlockProcessing, blockNum: blockNum,
            message: "End processing block " + blockNum
        });
    }

    private onError(error: Error, proceeding: boolean) {
        if (proceeding) {
            this.notify(undefined, {
                type: SingleDaemon.EventType.ReversibleError,
                error: error, moment: this.universalSynchronizer.getLastProcessedOperation(),
                message: " Reversible error: " + error.message + ". Retrying in 3 seconds..."
            });
        }
        else {
            this.notify(undefined, {
                type: SingleDaemon.EventType.UnhandledError,
                error: error, moment: this.universalSynchronizer.getLastProcessedOperation(),
                message: " Reversible error: " + error.message + ". Retrying in 3 seconds..."
            });
        }
    }

    // update preoaded rules to keep them up-to-date without calling blockchain every voteorder
    private onSetRules(setRules: SetRules, op: EffectuatedWiseOperation) {
        if (op.delegator === this.delegator) {
            const es: EffectuatedSetRules = {
                moment: op.moment,
                voter: op.voter,
                delegator: op.delegator,
                rulesets: setRules.rulesets
            };
            this.rules.push(es);
            Log.log().debug("SYNCHRONIZER_UPDATED_RULES=" + JSON.stringify(setRules.rulesets));
            this.notify(undefined, { type: SingleDaemon.EventType.RulesUpdated, moment: op.moment,
                message: "Change of rules on blockchain. Local rules were updated." });
        }
    }

    private onVoteorder(cmd: SendVoteorder, op: EffectuatedWiseOperation): Promise<void> {
        Log.log().cheapDebug(() => "SYNCHRONIZER_START_PROCESSING_VOTEORDER= " + JSON.stringify(op));

        const rules = this.determineRules(op, cmd);
        Log.log().cheapDebug(() => "SYNCHRONIZER_DETERMINED_RULES=" + JSON.stringify(rules));

        if (!rules) return this.rejectVoteorder(op, cmd, "There is no ruleset for you");

        const v = new Validator(this.api);
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
        Log.log().cheapDebug(() => "SYNCHRONIZER_ACCEPT_VOTEORDER= " + JSON.stringify({op: op, voteorder: cmd}));

        const opsToSend: steem.OperationWithDescriptor[] = [];

        const confirmCmd: ConfirmVote = {
            voteorderTxId: op.transaction_id,
            accepted: true,
            msg: "",
        };
        const wiseOp: WiseOperation = {
            voter: op.voter,
            delegator: this.delegator,
            command: confirmCmd
        };
        opsToSend.push(...this.protocol.serializeToBlockchain(wiseOp));

        const voteOp: VoteOperation = {
            voter: this.delegator,
            author: cmd.author,
            permlink: cmd.permlink,
            weight: cmd.weight
        };

        opsToSend.push(["vote", voteOp]);

        this.notify(undefined, { type: SingleDaemon.EventType.VoteorderPassed, voteorder: cmd, voteorderTxId: op.transaction_id, moment: op.moment, voter: op.voter, message: "Voteorder passed" });

        return this.api.sendToBlockchain(opsToSend).then((moment: SteemOperationNumber) => {
            this.notify(undefined, { type: SingleDaemon.EventType.OperarionsPushed,
            operations: opsToSend, moment: moment, message: "Sent operations to blockchain: " + _.join(opsToSend.map(op => op[0]), ",")});
        });
    }

    private rejectVoteorder(op: EffectuatedWiseOperation, cmd: SendVoteorder, msg: string): Promise<void> {
        Log.log().cheapDebug(() => "SYNCHRONIZER_REJECT_VOTEORDER= " + JSON.stringify({op: op, voteorder: cmd, msg: msg}));

        const confirmCmd: ConfirmVote = {
            voteorderTxId: op.transaction_id,
            accepted: false,
            msg: msg,
        };
        const wiseOp: WiseOperation = {
            voter: op.voter,
            delegator: this.delegator,
            command: confirmCmd
        };
        const opsToSend: steem.OperationWithDescriptor[] = this.protocol.serializeToBlockchain(wiseOp);

        this.notify(undefined, { type: SingleDaemon.EventType.VoteorderRejected, voteorder: cmd, voteorderTxId: op.transaction_id, moment: op.moment, voter: op.voter, message: "Voteorder rejected: " + msg, validationException: undefined });

        return this.api.sendToBlockchain(opsToSend).then((moment: SteemOperationNumber) => {
            this.notify(undefined, { type: SingleDaemon.EventType.OperarionsPushed,
            operations: opsToSend, moment: moment, message: "Sent operations to blockchain: " + _.join(opsToSend.map(op => op[0]), ",")});
        });
    }

    private notify(error: Error | undefined, event: SingleDaemon.Event) {
        (async () => {
            this.notifier(error, event);
            if (error) Log.log().error(JSON.stringify(error));
            Log.log().cheapInfo(() => "SYNCHRONIZER_EVENT=" + JSON.stringify(event));
        })();
    }
}

export namespace SingleDaemon {
    export interface NotifierCallback {
        (error: Error | undefined, event: SingleDaemon.Event): void;
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