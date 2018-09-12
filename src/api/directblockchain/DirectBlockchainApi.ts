import { Promise } from "bluebird";
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
    private username: string;
    private postingWif: string;
    private sendEnabled: boolean = true;

    public constructor(username: string, postingWif: string, steemOptions?: object) {
        super();

        this.steem = steem;
        this.username = username;
        this.postingWif = postingWif;

        if (steemOptions) this.steem.api.setOptions(steemOptions);
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

        return new Promise((resolve, reject) => {
            this.steem.api.getContent(author, permlink, function(error: Error, result: any) {
                Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_POST_RESULT="
                     + JSON.stringify({ author: author, permlink: permlink, result: result, error: error }));

                if (error) reject(error);
                else if (result.author.length === 0)
                    reject(new NotFoundException("The post (@" + author + "/" + permlink + ") does not exist"));
                else resolve(result as SteemPost);
            });
        });
    }

    public loadRulesets(
        delegator: string, voter: string, atMoment: SteemOperationNumber, protocol: Protocol
    ): Promise<SetRules> {
        Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_RULESETS="
             + JSON.stringify({ delegator: delegator, voter: voter, atMoment: atMoment }));

        return new Promise<SetRules>((resolve, reject) => {
            if (typeof delegator === "undefined" || delegator.length == 0)
                throw new Error("Delegator must not be empty");
            if (typeof voter === "undefined" || voter.length == 0) throw new Error("Voter must not be empty");

            const loadedRulesets: SetRules [] = [];

            let noResult: boolean = true;
            new SteemJsAccountHistorySupplier(this.steem, delegator)
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
                    noResult = false;
                    resolve(item.command as SetRules);
                    return false;
                }))
                .catch((error: Error) => {
                    noResult = false;
                    reject(error);
                    return false;
                });
            })
            .start(() => {
                if (noResult) resolve({rulesets: []} as SetRules);
            });
        })
        .then((result: SetRules) => Log.promiseResolveDebug("DIRECT_BLOCKCHAIN_API_LOAD_RULESETS_RESULT", result),
              (error: Error) => Log.promiseRejectionDebug("DIRECT_BLOCKCHAIN_API_LOAD_RULESETS_ERROR", error));
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise<SteemOperationNumber>((resolve, reject) => {
            const steemCallback = function(
                error: Error | undefined, result: { id: string, block_num: number, trx_num: number }
            ): void {
                Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_RESULT="
                     + JSON.stringify({operations: operations, error: error, rewsult: result }));

                if (error) reject(error);
                else {
                    resolve(new SteemOperationNumber(result.block_num, result.trx_num, operations.length - 1));
                }
            };

            if (this.sendEnabled) {
                Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_PENDING=" + JSON.stringify(operations));
                steem.broadcast.send(
                    {
                        extensions: [],
                        operations: operations
                    },
                    {posting: this.postingWif},
                    steemCallback
                );
            }
            else {
                Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_DISABLED=" + JSON.stringify(operations));

                steemCallback(undefined, { id: "direct-blockchain-api-send-disabled-false-id=" + Date.now(), block_num: 10000, trx_num: 1 });
            }
        });
    }

    public loadAllRulesets(delegator: string, atMoment: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_ALL_RULESETS=" + JSON.stringify({ delegator: delegator, atMoment: atMoment }));

        return new Promise<EffectuatedSetRules []>((resolve, reject) => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

            const allRules: EffectuatedSetRules [] = [];
            new SteemJsAccountHistorySupplier(this.steem, delegator)
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
                .catch((error: Error) => {
                    reject(error);

                    return false;
                });
            })
            .start(() => {
                resolve(allRules);
            });
        })
        .then((result: EffectuatedSetRules []) => Log.promiseResolveDebug("DIRECT_BLOCKCHAIN_API_LOAD_ALL_RULESETS_RESULT", result),
              (error: Error) => Log.promiseRejectionDebug("DIRECT_BLOCKCHAIN_API_LOAD_ALL_RULESETS_ERROR", error));
    }

    public getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber> {
        Log.cheapDebug(() => "DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT=" + JSON.stringify({ delegator: delegator }));

        return new Promise<SteemOperationNumber>((resolve, reject) => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

            let noResult = true;
            new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(WiseOperationTypeFilter.OperationType.ConfirmVote))
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    noResult = false;
                    resolve(item.moment);

                    return false;
                }))
                .catch((error: Error) => {
                    reject(error);

                    return false;
                });
            })
            .start(() => {
                if (noResult) resolve(V1Handler.INTRODUCTION_OF_WISE_MOMENT);
            });
        })
        .then((result: SteemOperationNumber) => Log.promiseResolveDebug("DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT_RESULT", result),
              (error: Error) => Log.promiseRejectionDebug("DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT_ERROR", error));
    }

    public getWiseOperations(username: string, until: Date, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        return new Promise((resolve, reject) => {
            if (typeof username === "undefined" || username.length == 0) throw new Error("Username must not be empty");

            const operations: EffectuatedWiseOperation [] = [];
            new SteemJsAccountHistorySupplier(this.steem, username)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
                .chain(new DateLimiter(until))
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    operations.push(item);
                    return true;
                }))
                .catch((error: Error) => {
                    reject(error);

                    return false;
                });
            })
            .start(() => {
                resolve(operations);
            });
        });
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol, skipDelegatorCheck: boolean = false): Promise<EffectuatedWiseOperation []> {
        return new Promise((resolve, reject) => {
            this.steem.api.getBlock(blockNum, (error: Error| undefined, block_: object) => {
                // TODO would it be better to use RPC method get_ops_in_block?
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
        return new Promise((resolve, reject) => {
            this.steem.api.getDynamicGlobalProperties((error: Error, result: DynamicGlobalProperties) => {
                if (error) reject(error);
                else resolve(result);
            });
        });
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        return new Promise((resolve, reject) => {
            this.steem.api.getAccounts([username], (error: Error, result: AccountInfo []) => {
                if (error) reject(error);
                else {
                    if (result.length > 0) {
                        resolve(result[0]);
                    }
                    else reject(new NotFoundException("Account " + username + " does not exist"));
                }
            });
        });
    }

    public getBlogEntries(username: string, startFrom: number, limit: number): Promise<BlogEntry []> {
        return this.steem.api.getBlogEntriesAsync(username, startFrom, limit);
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
