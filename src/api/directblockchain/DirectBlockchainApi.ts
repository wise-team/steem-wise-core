/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as steem from "steem";

import { SteemPost } from "../../blockchain/SteemPost";
import { SetRules } from "../../protocol/SetRules";
import { EffectuatedSetRules } from "../../protocol/EffectuatedSetRules";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { SimpleTaker } from "../../chainable/Chainable";
import { SteemTransaction } from "../../blockchain/SteemTransaction";
import { Api } from "../Api";
import { Protocol } from "../../protocol/Protocol";
import { V1Handler } from "../../protocol/versions/v1/V1Handler";
import { SteemJsAccountHistorySupplier } from "./SteemJsAccountHistorySupplier";
import { WiseOperationTypeFilter } from "../../chainable/filters/WiseOperationTypeFilter";
import { EffectuatedWiseOperation } from "../../protocol/EffectuatedWiseOperation";
import { OperationNumberFilter } from "../../chainable/filters/OperationNumberFilter";
import { ToWiseOperationTransformer } from "../../chainable/transformers/ToWiseOperationTransformer";
import { ChainableLimiter } from "../../chainable/limiters/ChainableLimiter";
import { VoterFilter } from "./VoterFilter";
import { DynamicGlobalProperties } from "../../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../../blockchain/AccountInfo";
import { NotFoundException } from "../../util/NotFoundException";
import { DateLimiter } from "./DateLimiter";
import { BlogEntry } from "../../blockchain/BlogEntry";
import { Log } from "../../util/log";

export class DirectBlockchainApi extends Api {
    private steem: any;
    private steemOptions?: any;
    private postingWif: string | undefined;
    private sendEnabled: boolean = true;

    public constructor(postingWif?: string, steemOptions?: object) {
        super();

        this.steem = steem;
        this.postingWif = postingWif;

        if (steemOptions) {
            this.steemOptions = steemOptions;
            this.updateOptions();
        }
    }

    public name(): string {
        return "DirectBlockchainApi";
    }

    public setSendEnabled(enabled: boolean) {
        Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_SET_SEND_ENABLED=" + enabled);

        this.sendEnabled = enabled;
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        Log.cheapDebug(
            () => "DIRECT_BLOCKCHAIN_API_LOAD_POST=" + JSON.stringify({ author: author, permlink: permlink }));

        this.updateOptions();
        const steemApiGetContent: ((author: string, permlink: string) => Promise<any>) =  BluebirdPromise.promisify(this.steem.api.getContent);
        return steemApiGetContent(author, permlink)
        .then((result: any) => {
            if (result.author.length === 0)
                    throw new NotFoundException("The post (@" + author + "/" + permlink + ") does not exist");
            return result as SteemPost;
        });
    }

    public loadRulesets(
        delegator: string, voter: string, atMoment: SteemOperationNumber, protocol: Protocol
    ): Promise<SetRules> {
        const loadedRulesets: SetRules [] = [];

        return BluebirdPromise.resolve()
        .then(() => {
            Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_RULESETS="
             + JSON.stringify({ delegator: delegator, voter: voter, atMoment: atMoment }));

             if (typeof delegator === "undefined" || delegator.length == 0)
                throw new Error("Delegator must not be empty");
             if (typeof voter === "undefined" || voter.length == 0)
                throw new Error("Voter must not be empty");

            this.updateOptions();
        })
        .then(() => new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                // this is limiter (restricts lookup to the period of wise presence):
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter())
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new VoterFilter(voter))
                .chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(
                    WiseOperationTypeFilter.OperationType.SetRules)
                )
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    loadedRulesets.push(item.command as SetRules);
                    return false;
                }))
                .catch((error: Error) => false); // if we return false on error, the Promise will be rejected
            })
            .start())
        .then(() => {
            if (loadedRulesets.length > 0) return loadedRulesets[0];
            else {
                const emptyResult: SetRules = { rulesets: [] };
                return emptyResult;
            }
        })
        .then(
            (result: SetRules) => Log.promiseResolveDebug("DIRECT_BLOCKCHAIN_API_LOAD_RULESETS_RESULT", result),
            (error: Error) => Log.promiseRejectionDebug("DIRECT_BLOCKCHAIN_API_LOAD_RULESETS_ERROR", error)
        );
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return BluebirdPromise.resolve()
        .then(() => {
            if (!this.sendEnabled) {
                Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_DISABLED=" + JSON.stringify(operations));
                return SteemOperationNumber.NEVER;
            }

            Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_PENDING=" + JSON.stringify(operations));
            this.updateOptions();
            return steem.broadcast.sendAsync(
                { extensions: [], operations: operations },
                { posting: this.postingWif },
            )
            .then(
                (result: { id: string, block_num: number, trx_num: number }) => {
                    Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_RESULT="
                        + JSON.stringify({operations: operations, error: undefined, result: result }));
                    return new SteemOperationNumber(result.block_num, result.trx_num, operations.length - 1);
                },
                (error: Error) => {
                    Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_RESULT="
                     + JSON.stringify({operations: operations, error: error, result: undefined }));
                     throw error;
                }
            );
        });
    }

    public loadAllRulesets(delegator: string, atMoment: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_ALL_RULESETS=" + JSON.stringify({ delegator: delegator, atMoment: atMoment }));

        const allRules: EffectuatedSetRules [] = [];

        return BluebirdPromise.resolve()
        .then(() => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

            this.updateOptions();
            return new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(WiseOperationTypeFilter.OperationType.SetRules))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    const out: EffectuatedSetRules = {
                        rulesets: (item.command as SetRules).rulesets,
                        moment: item.moment,
                        voter: item.voter
                    };
                    allRules.push(out);

                    return true;
                }))
                .catch((error: Error) => false); // if we do not continue on error the promise will be rejected with this error
            })
            .start();
        })
        .then(() => allRules)
        .then(
            (result: EffectuatedSetRules []) => Log.promiseResolveDebug("DIRECT_BLOCKCHAIN_API_LOAD_ALL_RULESETS_RESULT", result),
            (error: Error) => Log.promiseRejectionDebug("DIRECT_BLOCKCHAIN_API_LOAD_ALL_RULESETS_ERROR", error)
        );
    }

    public getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber> {
        Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT=" + JSON.stringify({ delegator: delegator }));

        let result: SteemOperationNumber = V1Handler.INTRODUCTION_OF_WISE_MOMENT;
        return BluebirdPromise.resolve()
        .then(() => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

            this.updateOptions();
            return new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(WiseOperationTypeFilter.OperationType.ConfirmVote))
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    result = item.moment;
                    return false;
                }))
                .catch((error: Error) => false); // if we do not continue on error the promise will be rejected with this error
            })
            .start();
        })
        .then(() => result)
        .then(
            (result: SteemOperationNumber) => Log.promiseResolveDebug("DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT_RESULT", result),
            (error: Error) => Log.promiseRejectionDebug("DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT_ERROR", error)
        );
    }

    public getWiseOperations(account: string, until: Date, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        const result: EffectuatedWiseOperation [] = [];

        return BluebirdPromise.resolve()
        .then(() => {
            if (typeof account === "undefined" || account.length == 0) throw new Error("Username must not be empty");

            this.updateOptions();
            return new SteemJsAccountHistorySupplier(this.steem, account)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
                .chain(new DateLimiter(until))
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    result.push(item);
                    return true;
                }))
                .catch((error: Error) => false); // if we do not continue on error the promise will be rejected with this error
            })
            .start();
        })
        .then(() => result);
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol, skipDelegatorCheck: boolean = false): Promise<EffectuatedWiseOperation []> {
        return new BluebirdPromise((resolve, reject) => {
            this.updateOptions();
            this.steem.api.getBlock(blockNum, (error: Error| undefined, block_: object) => {
                if (error) reject(error);
                else {
                    if (!block_) {
                        setTimeout(() =>
                            this.getWiseOperationsRelatedToDelegatorInBlock(delegator, blockNum, protocol, skipDelegatorCheck)
                            .then((result: EffectuatedWiseOperation []) => { resolve(result); }, e => { reject(e); })
                        , 1500);
                    }
                    else {
                        const block = block_ as Block;
                        resolve(
                            this.getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator, blockNum, block, protocol, skipDelegatorCheck)
                        );
                    }
                }
            });
        });
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator: string, blockNum: number, block: Block, protocol: Protocol, skipDelegatorCheck: boolean): EffectuatedWiseOperation [] {
        let out: EffectuatedWiseOperation [] = [];

        const block_num = blockNum;
        const timestampUtc = block.timestamp;
        for (let transaction_num = 0; transaction_num < block.transactions.length; transaction_num++) {
            const transaction = block.transactions[transaction_num];

            out = out.concat(this.getWiseOperationsRelatedToDelegatorInBlock_processTransaction(
                delegator, blockNum, transaction_num, transaction,
                new Date(timestampUtc + "Z" /* this is UTC date */), protocol, skipDelegatorCheck
            ));
        }

        return out;
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processTransaction(
        delegator: string, blockNum: number, transactionNum: number, transaction: Transaction,
        timestamp: Date, protocol: Protocol, skipDelegatorCheck: boolean
    ): EffectuatedWiseOperation [] {
        const out: EffectuatedWiseOperation [] = [];
        const steemTx: SteemTransaction = {
            block_num: blockNum,
            transaction_num: transactionNum,
            transaction_id: transaction.transaction_id,
            timestamp: timestamp,
            ops: transaction.operations
        };
        const handleResult = protocol.handleOrReject(steemTx);

        if (handleResult) {
            handleResult.forEach(wiseOp => {
                if (skipDelegatorCheck || wiseOp.delegator === delegator) out.push(wiseOp);
            });
        }

        return out;
    }

    /**
     * This function is specific only to DirectBlockchainApi. It returns all wise operations in block
     * (without checking delegator).
     * @param blockNum - number of the block.
     * @param protocol - Protocol object.
     */
    public getAllWiseOperationsInBlock(blockNum: number, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        return this.getWiseOperationsRelatedToDelegatorInBlock("", blockNum, protocol, true /* skip delegator check */);
    }

    public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        this.updateOptions();
        return BluebirdPromise.resolve()
        .then(() => this.steem.api.getDynamicGlobalPropertiesAsync());
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        this.updateOptions();
        return BluebirdPromise.resolve()
        .then(() => this.steem.api.getAccountsAsync([username]))
        .then((result: AccountInfo []) => {
            if (result.length > 0) {
                return result[0];
            }
            else throw new NotFoundException("Account " + username + " does not exist");
        });
    }

    public getBlogEntries(username: string, startFrom: number, limit: number): Promise<BlogEntry []> {
        this.updateOptions();
        return this.steem.api.getBlogEntriesAsync(username, startFrom, limit);
    }

    private updateOptions() {
        if (this.steemOptions) this.steem.api.setOptions(this.steemOptions);
    }
}


export interface Block {
    block_id: string;
    previous: string;
    timestamp: string;
    transactions: Transaction [];
    [x: string]: any; // allows other properties
}

export interface Transaction {
    ref_block_num: number;
    transaction_id: string;
    operations: [string, object] [];
    [x: string]: any; // allows other properties
}
