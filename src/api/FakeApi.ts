import * as Promise from "bluebird";
import * as _ from "lodash";
import * as _log from "loglevel"; const log = _log.getLogger("steem-wise-core");

import { SteemPost } from "../../src/blockchain/SteemPost";
import { SetRules, EffectuatedSetRules, isSetRules } from "../../src/protocol/SetRules";
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";
import { SteemTransaction } from "../../src/blockchain/SteemTransaction";
import { Api } from "../../src/api/Api";
import { Protocol } from "../../src/protocol/Protocol";
import { EffectuatedSmartvotesOperation } from "../../src/protocol/EffectuatedSmartvotesOperation";
import { DynamicGlobalProperties } from "../../src/blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../../src/blockchain/AccountInfo";
import { isConfirmVote } from "../protocol/ConfirmVote";
import { V1Handler } from "../protocol/versions/v1/V1Handler";
import { NotFoundException } from "../util/NotFoundException";
import { BlogEntry } from "../blockchain/BlogEntry";
import { Util } from "../util/util";

// TODO very slow. Examine why (maybe DirecrBlockchain could also be speeded up)
export class FakeApi extends Api {
    private posts: SteemPost [];
    private transactions: SteemTransaction [];
    private dynamicGlobalProperties: DynamicGlobalProperties;
    private accounts: AccountInfo [];
    private blogEntries: BlogEntry [];
    private currentBlock = 0;
    private pushedOperations: SteemTransaction [] = [];
    private fakeTime: Date | undefined = undefined;
    private fakeDelayMs: number = 5;
    private transactionsByBlock: { [key: string]: SteemTransaction [] } = {};

    public constructor(posts: SteemPost [], dynamicGlobalProperties: DynamicGlobalProperties, accounts: AccountInfo [], transactions: SteemTransaction [], blogEntries: BlogEntry []) {
        super();

        this.posts = posts;
        this.dynamicGlobalProperties = dynamicGlobalProperties;
        this.accounts = accounts;
        this.transactions = transactions;
        this.transactions = this.transactions.map((trx: SteemTransaction) => {
            trx.timestamp = new Date(trx.timestamp as any); // prototype timestamp loaded from json
            return trx;
        });
        /*this.currentBlock = Math.max(
            this.transactions.map(trx => trx.block_num).reduce((maxBlockNum, thisBlockNum) => maxBlockNum = Math.max(maxBlockNum, thisBlockNum), 0),
            this.dynamicGlobalProperties.head_block_number
        );*/
        this.currentBlock = this.transactions.map(trx => trx.block_num)
            .reduce((maxBlockNum, thisBlockNum) => maxBlockNum = Math.max(maxBlockNum, thisBlockNum), 0) + 1;
        this.blogEntries = blogEntries;

        this.transactions.forEach(trx => {
            if (this.transactionsByBlock.hasOwnProperty(trx.block_num + "")) {
                this.transactionsByBlock[trx.block_num + ""].push(trx);
            }
            else this.transactionsByBlock[trx.block_num + ""] = [trx];
        });
    }

    public static fromDataset(dataset: FakeApi.Dataset): FakeApi {
        return new FakeApi(dataset.posts, dataset.dynamicGlobalProperties, dataset.accounts, dataset.transactions, dataset.blogEntries);
    }

    public name(): string {
        return "FakeApi";
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise<SteemPost>((resolve, reject) => {
            for (let i = 0; i < this.posts.length; i++) {
                if (this.posts[i].author === author && this.posts[i].permlink === permlink) {
                    setTimeout(() => resolve(this.posts[i]), this.fakeDelayMs);
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

    public sendToBlockchain(operationsInTransaction: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => {
            const blockNum = this.currentBlock + 1;
            const steemTrx: SteemTransaction = {
                block_num: blockNum,
                transaction_num: 0,
                transaction_id: "",
                timestamp: (this.fakeTime ? this.fakeTime : new Date()),
                ops: _.reverse(operationsInTransaction)
            };
            this.transactions.push(steemTrx);
            this.pushedOperations.push(steemTrx);
            this.transactionsByBlock[blockNum + ""] = [steemTrx];
            this.currentBlock = blockNum;

            Util.cheapDebug(() => "FAKE_API_PUSHED_TRX=" + JSON.stringify(steemTrx));
            setTimeout(() => resolve(new SteemOperationNumber(blockNum, 0, operationsInTransaction.length - 1)), this.fakeDelayMs);
        });
    }

    public loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        return new Promise((resolve, reject) => {
            const result: EffectuatedSetRules [] = [];
            for (let i = 0; i < this.transactions.length; i++) {
                const trx = this.transactions[i];
                const handleResult = protocol.handleOrReject(trx);
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
            setTimeout(() => resolve(result), this.fakeDelayMs);
        });
    }

    public getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(
                this.transactions
                .map((trx: SteemTransaction) => protocol.handleOrReject(trx))
                .filter((handledOrRejected: EffectuatedSmartvotesOperation [] | undefined) => (!!handledOrRejected))
                .map((handled: EffectuatedSmartvotesOperation [] | undefined) => handled as EffectuatedSmartvotesOperation [])
                .reduce((allOps: EffectuatedSmartvotesOperation [], nextOps: EffectuatedSmartvotesOperation []) => allOps.concat(nextOps))
                .filter((effSop: EffectuatedSmartvotesOperation) => isConfirmVote(effSop.command))
                .map((effSop: EffectuatedSmartvotesOperation) => effSop.moment)
                .reduce((newest: SteemOperationNumber, current: SteemOperationNumber) => {
                    if (current.isGreaterThan(newest)) return current;
                    else return newest;
                }, V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT)
            ), this.fakeDelayMs);
        });
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol): Promise<EffectuatedSmartvotesOperation []> {
        return new Promise((resolve, reject) => {
            if (blockNum > this.currentBlock + 1) reject(new Error("Cannot get block that has number (" + blockNum + ") greater than next block (" + (this.currentBlock + 1) + ") (blockNum must be <= this.currentBlockNum+1)"));
            let awaitBlock: (thenFn: () => void) => void = () => {};
            awaitBlock = (thenFn: () => void) => {
                if (blockNum <= this.currentBlock) thenFn();
                else {
                    setTimeout(() => awaitBlock(thenFn), this.fakeDelayMs);
                }
            };
            setTimeout(() => {
                awaitBlock(() => {
                    if (this.transactionsByBlock.hasOwnProperty(blockNum + "")) resolve(
                        this.transactionsByBlock[blockNum + ""]
                        .filter ((trx: SteemTransaction) => trx.block_num === blockNum)
                        .map((trx: SteemTransaction) => protocol.handleOrReject(trx))
                        .filter((handledOrRejected: EffectuatedSmartvotesOperation [] | undefined) => !!handledOrRejected)
                        .map((handled: EffectuatedSmartvotesOperation [] | undefined) => handled as EffectuatedSmartvotesOperation [])
                        .reduce((allOps: EffectuatedSmartvotesOperation [], nextOps: EffectuatedSmartvotesOperation []) => allOps.concat(nextOps), [])
                        .filter((effSop: EffectuatedSmartvotesOperation) => effSop.delegator === delegator)
                    );
                    else resolve([]);
                });
                /*}
                else {
                    resolve([]);
                }*/
            }, this.fakeDelayMs);
        });
    }

    public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        return new Promise((resolve, reject) => {
            this.dynamicGlobalProperties.time = new Date().toISOString().replace("Z", "");
            this.dynamicGlobalProperties.head_block_number = this.currentBlock;
            setTimeout(() => resolve(_.cloneDeep(this.dynamicGlobalProperties)), this.fakeDelayMs);
        });
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        return new Promise((resolve, reject) => {
            const result = this.accounts.filter((info: AccountInfo) => info.name === username);
            if (result.length === 0) setTimeout(() => reject(new NotFoundException("Account " + username + " does not exist")), this.fakeDelayMs);
            else setTimeout(() => resolve(result[0]), this.fakeDelayMs);
        });
    }

    public getWiseOperations(username: string, until: Date, protocol: Protocol): Promise<EffectuatedSmartvotesOperation []> {
        return new Promise((resolve, reject) => {
            const result: EffectuatedSmartvotesOperation [] = [];
            for (let i = 0; i < this.transactions.length; i++) {
                const op = this.transactions[i];
                const handleResult = protocol.handleOrReject(op);
                if (handleResult) {
                    for (let j = 0; j < handleResult.length; j++) {
                        const effSo = handleResult[j];
                        if ((effSo.delegator === username && isConfirmVote(effSo.command))
                         || (effSo.voter === username)) {
                            // (up) fake blockchain does not provide
                            // information on who pushed the operation to blockchain,
                            // so this hacky way is the only way to get this information.
                            // fortunately FakeApi is only used for unit testing.
                            if (effSo.timestamp.getTime() >= until.getTime()) {
                                result.push(effSo);
                            }
                        }
                    }
                }
            }
            setTimeout(() => resolve(result), this.fakeDelayMs);
        });
    }

    public getBlogEntries(username: string, startFrom: number, limit: number): Promise<BlogEntry []> {
        return new Promise((resolve, reject) => {
            const result: BlogEntry [] = [];
            let userI = 0;
            for (let i = 0; i < this.blogEntries.length; i++) {
                const entry = this.blogEntries[i];
                if (entry.blog == username) {
                    if (userI >= startFrom && userI < startFrom + limit)
                        result.push(entry);
                    userI++;
                }
            }
            setTimeout(() => resolve(result), this.fakeDelayMs);
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
    public getPushedTransactions(): SteemTransaction [] {
        return this.pushedOperations;
    }

    public setFakeTime(fakeTime_: Date) {
        this.fakeTime = fakeTime_;
    }

    public setFakeDelayMs(delayMs: number) {
        this.fakeDelayMs = delayMs;
    }
}

export namespace FakeApi {
    export interface Dataset {
        posts: SteemPost [];
        dynamicGlobalProperties: DynamicGlobalProperties;
        accounts: AccountInfo [];
        transactions: SteemTransaction [];
        blogEntries: BlogEntry [];
    }
}