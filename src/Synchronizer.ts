import { Api } from "./api/Api";
import { Protocol } from "./protocol/Protocol";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { SimpleTaker } from "./chainable/Chainable";
import { SteemOperation } from "./blockchain/SteemOperation";
import { SetRules, EffectuatedSetRules, isSetRules } from "./protocol/SetRules";
import { Promise } from "bluebird";
import { EffectuatedSmartvotesOperation } from "./protocol/EffectuatedSmartvotesOperation";
import { isConfirmVote, ConfirmVote } from "./protocol/ConfirmVote";
import { isSendVoteorder, SendVoteorder } from "./protocol/SendVoteorder";
import { Validator } from "./validation/Validator";
import { ValidationError } from "./validation/ValidationError";
import { SmartvotesOperation } from "./protocol/SmartvotesOperation";

export class Synchronizer {
    private synchronizationStoppedMsg: string = "Synchronization stopped";

    private api: Api;
    private protocol: Protocol;
    private delegator: string;
    private rules: EffectuatedSetRules [] = [];

    private lastProcessedOperationNum: SteemOperationNumber = new SteemOperationNumber(0, 0, 0);

    public constructor(api: Api, protocol: Protocol, delegator: string) {
        this.api = api;
        this.protocol = protocol;
        this.delegator = delegator;
    }

    public runLoop(since: SteemOperationNumber, notifierCallback: (error: Error | undefined, message: string, moment: SteemOperationNumber) => boolean) {
        this.api.loadAllRulesets(this.delegator, since, this.protocol)
        .then(((rules: EffectuatedSetRules []) => {
            this.rules = rules;
            this.processBlock(since.blockNum, notifierCallback);
        }))
        .catch((error: Error) => {
            console.error("Synchronizer loop terminated due to error");
            console.error(error);
        });
    }

    private processBlock(blockNum: number, notifierCallback: (error: Error | undefined, message: string, moment: SteemOperationNumber) => boolean) {
        if (!notifierCallback(undefined, "Loading block", new SteemOperationNumber(blockNum, 0, 0))) return;

        Promise.resolve(true)
        .then(() => this.api.getWiseOperationsRelatedToDelegatorInBlock(this.delegator, blockNum))
        .mapSeries((op: EffectuatedSmartvotesOperation) => {
            return this.processOperation(op);
        })
        .then(() => {
            this.processBlock(blockNum + 1, notifierCallback);
        })
        .then(() => {
            if (!notifierCallback(undefined, "Finished processing block", this.lastProcessedOperationNum)) throw new Error(this.synchronizationStoppedMsg);
        })
        .catch((error: Error) => {
            if (error.message === this.synchronizationStoppedMsg) return;

            if (notifierCallback(error, "Got error. Reloading the same block in 3 seconds.", this.lastProcessedOperationNum)) {
                setTimeout(() => this.processBlock(blockNum, notifierCallback), 3000);
            }
        });
    }

    private processOperation(op: EffectuatedSmartvotesOperation): Promise<void> {
        return new Promise((resolve, reject) => {
            const currentOpNum = new SteemOperationNumber(op.block_num, op.transaction_num, op.operation_num);
            if (currentOpNum.isLesserOrEqual(this.lastProcessedOperationNum)) resolve();
            else {
                if (op.delegator === this.delegator) {
                    if (isSetRules(op.command)) this.updateRulesArray(op, op.command).then(() => resolve()).catch((error: Error) => reject(error));
                    else if (isSendVoteorder(op.command)) this.processVoteorder(op, op.command).then(() => resolve()).catch((error: Error) => reject(error));
                }
                this.lastProcessedOperationNum = currentOpNum;
            }
        });
    }

    private updateRulesArray(op: EffectuatedSmartvotesOperation, cmd: SetRules): Promise<void> {
        return new Promise((resolve, reject) => {
            const es: EffectuatedSetRules = {
                moment: new SteemOperationNumber(op.block_num, op.transaction_num, op.operation_num),
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
                v.provideRulesets(rules);
                v.validate(this.delegator, op.voter, cmd, new SteemOperationNumber(op.block_num, op.transaction_num, op.operation_num),
                    (error: Error | undefined, result: true | ValidationError | undefined): void => {
                        if (error) reject(error);
                        else if (result === true) {
                            this.voteAndConfirm(op, cmd).then(() => resolve()).catch((error: Error) => reject(error));
                        }
                        else {
                            this.rejectVoteorder(op, cmd, (result as ValidationError).message).then(() => resolve()).catch((error: Error) => reject(error));
                        }
                    });
            }
            else this.rejectVoteorder(op, cmd, "There is no ruleset for you").then(() => resolve()).catch((error: Error) => reject(error));
        });
    }

    private determineRules(op: EffectuatedSmartvotesOperation, cmd: SendVoteorder): EffectuatedSetRules | undefined {
        let out: EffectuatedSetRules | undefined = undefined;
        const moment = new SteemOperationNumber(op.block_num, op.transaction_num, op.operation_num);

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
        const opsToSend: [string, object][] = this.protocol.serializeToBlockchain(wiseOp);

        const voteOp: VoteOperation = {
            voter: this.delegator,
            author: cmd.author,
            permlink: cmd.permlink,
            weight: cmd.weight
        };

        opsToSend.push(["vote", voteOp]);

        return this.api.sendToBlockchain(opsToSend).then(() => {});
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

        return this.api.sendToBlockchain(opsToSend).then(() => {});
    }
}

interface VoteOperation {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
}