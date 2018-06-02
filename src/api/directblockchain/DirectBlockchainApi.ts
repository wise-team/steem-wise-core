import { Promise } from "bluebird";
import * as steem from "steem";

import { SteemPost } from "../../blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../../protocol/SetRules";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { ChainableSupplier, ChainableFilter, ChainableTransformer, SimpleTaker } from "../../chainable/Chainable";
import { SteemOperation } from "../../blockchain/SteemOperation";
import { Api } from "../Api";
import { Protocol } from "../../protocol/Protocol";
import { CustomJsonOperation } from "../../blockchain/CustomJsonOperation";
import { V1Handler } from "../../protocol/versions/v1/V1Handler";
import { RawOperation } from "./RawOperation";
import { SteemJsAccountHistorySupplier } from "./SteemJsAccountHistorySupplier";
import { SmartvotesOperationTypeFilter } from "../../chainable/filters/SmartvotesOperationTypeFilter";
import { EffectuatedSmartvotesOperation } from "../../protocol/EffectuatedSmartvotesOperation";
import { OperationNumberFilter } from "../../chainable/filters/OperationNumberFilter";
import { ToSmartvotesOperationTransformer } from "../../chainable/transformers/ToSmartvotesOperationTransformer";
import { ChainableLimiter } from "../../chainable/limiters/ChainableLimiter";
import { VoterFilter } from "./VoterFilter";
import { PrechainedSupplier } from "../../chainable/PrechainedSupplier";
import { DynamicGlobalProperties } from "../../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../../blockchain/AccountInfo";
import { NotFoundException } from "../../util/NotFoundException";

export class DirectBlockchainApi extends Api {
    private steem: any;
    private username: string;
    private postingWif: string;

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

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise((resolve, reject) => {
            this.steem.api.getContent(author, permlink, function(error: Error, result: any) {
                if (error) reject(error);
                else if (result.author.length === 0) reject(new NotFoundException("The post (@" + author + "/" + permlink + ") does not exist"));
                else resolve(result as SteemPost);
            });
        });
    }

    public loadRulesets(delegator: string, voter: string, atMoment: SteemOperationNumber, protocol: Protocol): Promise<SetRules> {
        return new Promise((resolve, reject) => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");
            if (typeof voter === "undefined" || voter.length == 0) throw new Error("Voter must not be empty");

            const loadedRulesets: SetRules [] = [];

            let noResult: boolean = true;
            new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of smartvotes presence)
                .chain(new ToSmartvotesOperationTransformer(protocol))
                .chain(new VoterFilter(voter))
                .chain(new SmartvotesOperationTypeFilter<EffectuatedSmartvotesOperation>(SmartvotesOperationTypeFilter.OperationType.SetRules))
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: EffectuatedSmartvotesOperation): boolean => {
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
        });
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise<SteemOperationNumber>((resolve, reject) => {
            const steemCallback = function(error: Error | undefined, result: { id: string, block_num: number, trx_num: number }): void {
                if (error) reject(error);
                else {
                    resolve(new SteemOperationNumber(result.block_num, result.trx_num, operations.length - 1));
                }
            };

            steem.broadcast.send(
                {
                    extensions: [],
                    operations: operations
                },
                {posting: this.postingWif},
                steemCallback
            );
        });
    }

    public loadAllRulesets(delegator: string, atMoment: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        return new Promise((resolve, reject) => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

            const allRules: EffectuatedSetRules [] = [];
            new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of smartvotes presence)
                .chain(new ToSmartvotesOperationTransformer(protocol))
                .chain(new SmartvotesOperationTypeFilter<EffectuatedSmartvotesOperation>(SmartvotesOperationTypeFilter.OperationType.SetRules))
                .chain(new SimpleTaker((item: EffectuatedSmartvotesOperation): boolean => {
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
        });
    }

    public getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

            let noResult = true;
            new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of smartvotes presence)
                .chain(new ToSmartvotesOperationTransformer(protocol))
                .chain(new SmartvotesOperationTypeFilter<EffectuatedSmartvotesOperation>(SmartvotesOperationTypeFilter.OperationType.ConfirmVote))
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: EffectuatedSmartvotesOperation): boolean => {
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
                if (noResult) resolve(V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT);
            });
        });
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol): Promise<EffectuatedSmartvotesOperation []> {
        return new Promise((resolve, reject) => {
            this.steem.api.getBlock(blockNum, (error: Error| undefined, block_: object) => { // TODO would it be better to use RPC method get_ops_in_block?
                if (error) reject(error);
                else {
                    const block = block_ as Block;
                    resolve(this.getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator, blockNum, block, protocol));
                }
            });
        });
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator: string, blockNum: number, block: Block, protocol: Protocol): EffectuatedSmartvotesOperation [] {
        let out: EffectuatedSmartvotesOperation [] = [];

        const block_num = blockNum;
        const timestampUtc = block.timestamp;
        for (let transaction_num = 0; transaction_num < block.transactions.length; transaction_num++) {
            const transaction = block.transactions[transaction_num];

            for (let operation_num = 0; operation_num < transaction.operations.length; operation_num++) {
                const operation: Operation = {
                    block_num: block_num,
                    transaction_num: transaction_num,
                    transaction_id: transaction.transaction_id,
                    operation_num: operation_num,
                    timestamp: new Date(timestampUtc + "Z" /* this is UTC date */),
                    op: transaction.operations[operation_num]
                };
                out = out.concat(this.getWiseOperationsRelatedToDelegatorInBlock_processOperation(delegator, operation, protocol));
            }
        }

        return out;
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processOperation(delegator: string, operation: Operation, protocol: Protocol): EffectuatedSmartvotesOperation [] {
        const out: EffectuatedSmartvotesOperation [] = [];
        const steemOp: SteemOperation = {
            block_num: operation.block_num,
            transaction_num: operation.transaction_num,
            transaction_id: operation.transaction_id,
            operation_num: operation.operation_num,
            timestamp: new Date(operation.timestamp + "Z"), // this is UTC time (Z marks it so that it can be converted to local time properly)
            op: operation.op
        };
        const handleResult = protocol.handleOrReject(steemOp);

        if (handleResult) {
            for (let i = 0; i < handleResult.length; i++) {
                const wiseOp: EffectuatedSmartvotesOperation = handleResult[i];
                if (wiseOp.delegator === delegator) out.push(wiseOp);
            }
        }

        return out;
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

export interface Operation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    operation_num: number;
    timestamp: Date;
    op: [string, object];
}




