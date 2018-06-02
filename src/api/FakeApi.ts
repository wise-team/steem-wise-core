import * as Promise from "bluebird";
import * as _ from "lodash";

import { SteemPost } from "../../src/blockchain/SteemPost";
import { SetRules, EffectuatedSetRules, isSetRules } from "../../src/protocol/SetRules";
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../../src/chainable/Chainable";
import { SteemOperation } from "../../src/blockchain/SteemOperation";
import { Api } from "../../src/api/Api";
import { Protocol } from "../../src/protocol/Protocol";
import { DirectBlockchainApi } from "../../src/api/directblockchain/DirectBlockchainApi";
import { EffectuatedSmartvotesOperation } from "../../src/protocol/EffectuatedSmartvotesOperation";
import { DynamicGlobalProperties } from "../../src/blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../../src/blockchain/AccountInfo";
import { isConfirmVote } from "../protocol/ConfirmVote";
import { V1Handler } from "../protocol/versions/v1/V1Handler";
import { NotFoundException } from "../util/NotFoundException";

// TODO very slow. Examine why (maybe DirecrBlokchain could also be speeded up)
export class FakeApi extends Api {
    private posts: SteemPost [];
    private operations: SteemOperation [];
    private dynamicGlobalProperties: DynamicGlobalProperties;
    private accounts: AccountInfo [];
    private currentBlock = 0;
    private pushedOperations: SteemOperation [] = [];

    public constructor(posts: SteemPost [], dynamicGlobalProperties: DynamicGlobalProperties, accounts: AccountInfo [], operations: SteemOperation []) {
        super();

        this.posts = posts;
        this.dynamicGlobalProperties = dynamicGlobalProperties;
        this.accounts = accounts;
        this.operations = operations;
        this.currentBlock = this.operations.map(op => op.block_num).reduce((maxBlockNum, thisBlockNum) => maxBlockNum = Math.max(maxBlockNum, thisBlockNum), 0);
    }

    public static fromDataset(dataset: FakeApi.Dataset): FakeApi {
        return new FakeApi(dataset.posts, dataset.dynamicGlobalProperties, dataset.accounts, dataset.operations);
    }

    public name(): string {
        return "FakeApi";
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise<SteemPost>((resolve, reject) => {
            for (let i = 0; i < this.posts.length; i++) {
                if (this.posts[i].author === author && this.posts[i].permlink === permlink) {
                    setTimeout(() => resolve(this.posts[i]), 4);
                    return;
                }
            }

            reject(new NotFoundException("No such post @" + author + "/" + permlink));
        });
    }

    public loadRulesets(delegator: string, voter: string, at: SteemOperationNumber, protocol: Protocol): Promise<SetRules> {
        return this.loadAllRulesets(delegator, at, protocol).then((rulesets: EffectuatedSetRules []) => {
            const votersRulesets: EffectuatedSetRules[] =  rulesets
                .filter((ruleset: EffectuatedSetRules) => ruleset.voter == voter);

            if (votersRulesets.length == 0) return { rulesets: [] } as SetRules;
            else return votersRulesets.reduce((result: EffectuatedSetRules, ruleset: EffectuatedSetRules) => {
                if (ruleset.moment.isGreaterThan(result.moment)) return ruleset;
                else return result;
            });
        });
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => {
            const blockNum = this.currentBlock + 1;
            for (let i = 0; i < operations.length; i++) {
                const op = operations[i];
                const steemOp: SteemOperation = {
                    block_num: blockNum,
                    transaction_num: 0,
                    operation_num: i,
                    transaction_id: "",
                    timestamp: new Date(),
                    op: op
                };
                this.operations.push(steemOp);
                this.pushedOperations.push(steemOp);
                this.currentBlock = blockNum;
            }
            setTimeout(() => resolve(new SteemOperationNumber(blockNum, 0, operations.length - 1)), 4);
        });
    }

    public loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        return new Promise((resolve, reject) => {
            const result: EffectuatedSetRules [] = [];
            for (let i = 0; i < this.operations.length; i++) {
                const op = this.operations[i];
                const handleResult = protocol.handleOrReject(op);
                if (handleResult) {
                    for (let j = 0; j < handleResult.length; j++) {
                        const effSo = handleResult[j];
                        if (isSetRules(effSo.command) &&
                            effSo.delegator === delegator) {
                            if (at.isGreaterOrEqual(effSo.moment)) {
                                const effSetRules: EffectuatedSetRules = {
                                    rulesets: effSo.command.rulesets,
                                    voter: effSo.voter,
                                    moment: effSo.moment
                                };
                                result.push(effSetRules);
                            }
                        }
                    }
                }
            }
            setTimeout(() => resolve(result), 4);
        });
    }

    public getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(
                this.operations
                .map((op: SteemOperation) => protocol.handleOrReject(op))
                .filter((handledOrRejected: EffectuatedSmartvotesOperation [] | undefined) => (!!handledOrRejected))
                .map((handled: EffectuatedSmartvotesOperation [] | undefined) => handled as EffectuatedSmartvotesOperation [])
                .reduce((allOps: EffectuatedSmartvotesOperation [], nextOps: EffectuatedSmartvotesOperation []) => allOps.concat(nextOps))
                .filter((effSop: EffectuatedSmartvotesOperation) => isConfirmVote(effSop.command))
                .map((effSop: EffectuatedSmartvotesOperation) => effSop.moment)
                .reduce((newest: SteemOperationNumber, current: SteemOperationNumber) => {
                    if (current.isGreaterThan(newest)) return current;
                    else return newest;
                }, V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT)
            ), 4);
        });
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol): Promise<EffectuatedSmartvotesOperation []> {
        return new Promise((resolve, reject) => {
            if (blockNum > this.currentBlock + 1) reject(new Error("Cannot get block that has number greater than next block (blockNum must be <= this.currentBlockNum+1)"));
            let awaitBlock: (thenFn: () => void) => void = () => {};
            awaitBlock = (thenFn: () => void) => {
                if (blockNum <= this.currentBlock) thenFn();
                else {
                    setTimeout(() => awaitBlock(thenFn), 4);
                }
            };

            setTimeout(() => awaitBlock(() => resolve(
                this.operations
                .filter ((op: SteemOperation) => op.block_num === blockNum)
                .map((op: SteemOperation) => protocol.handleOrReject(op))
                .filter((handledOrRejected: EffectuatedSmartvotesOperation [] | undefined) => (!!handledOrRejected))
                .map((handled: EffectuatedSmartvotesOperation [] | undefined) => handled as EffectuatedSmartvotesOperation [])
                .reduce((allOps: EffectuatedSmartvotesOperation [], nextOps: EffectuatedSmartvotesOperation []) => allOps.concat(nextOps), [])
                .filter((effSop: EffectuatedSmartvotesOperation) => effSop.delegator === delegator)
            )), 5);
        });
    }

    public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        return new Promise((resolve, reject) => {
            this.dynamicGlobalProperties.time = new Date().toISOString().replace("Z", "");
            this.dynamicGlobalProperties.head_block_number = this.currentBlock;
            setTimeout(() => resolve(_.cloneDeep(this.dynamicGlobalProperties)), 4);
        });
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        return new Promise((resolve, reject) => {
            const result = this.accounts.filter((info: AccountInfo) => info.name === username);
            if (result.length === 0) setTimeout(() => reject(new NotFoundException("Account " + username + " does not exist")), 4);
            else setTimeout(() => resolve(result[0]), 4);
        });
    }

    public getCurrentBlockNum(): number {
        return this.currentBlock;
    }

    public pushFakeBlock(): Promise<SteemOperationNumber> {
        const op: [string, object] = ["fake", {}];
        return this.sendToBlockchain([op]);
    }

    /**
     * Returns all operations that were pushed using #sentToBlockchain() after initialization of FakeApi.
     */
    public getPushedOperations(): SteemOperation [] {
        return this.pushedOperations;
    }
}

export namespace FakeApi {
    export interface Dataset {
        posts: SteemPost [];
        dynamicGlobalProperties: DynamicGlobalProperties;
        accounts: AccountInfo [];
        operations: SteemOperation [];
    }
}