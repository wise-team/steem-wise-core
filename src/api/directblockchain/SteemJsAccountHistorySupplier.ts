/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";
import * as steem from "steem";

import { Log } from "../../log/Log";

import { ChainableSupplier } from "../../chainable/Chainable";
import { UnifiedSteemTransaction } from "../../blockchain/UnifiedSteemTransaction";

export class SteemJsAccountHistorySupplier extends ChainableSupplier<
    UnifiedSteemTransaction,
    SteemJsAccountHistorySupplier
> {
    private steem: steem.api.Steem;
    private username: string;
    private batchSize: number = 1000;
    private onFinishCallback: ((error: Error | undefined) => void) = () => {};

    constructor(steem: steem.api.Steem, username: string) {
        super();
        this.steem = steem;
        this.username = username;

        if (!this.steem) throw new Error("Supplied steem object is null");
    }

    protected me(): SteemJsAccountHistorySupplier {
        return this;
    }

    public async start(): Promise<void> {
        // load and iterate over blockchain
        this.loadFromOnlyIfConsumers(-1);

        await new BluebirdPromise((resolve, reject) => {
            this.onFinishCallback = (error: Error | undefined) => {
                if (error) reject(error);
                else resolve();
            };
        });
    }

    private loadFromOnlyIfConsumers(from: number): void {
        if (this.shouldLoadNewItems()) {
            this.loadFrom(from);
        }
    }

    private loadFrom(from: number) {
        // Sometimes at the end of account history "from" can be lower than 1000. In that case we should set limit to "from". It will simply load operations including the oldest one.
        const batchLimit = from === -1 ? this.batchSize : Math.min(this.batchSize, from);

        Log.log().debug(
            "STEEMJSACCOUNTHISTORYSUPPLIER_GET_ACCOUNT_HISTORY_ASYNC=" +
                JSON.stringify({ username: this.username, from: from, batchLimit: batchLimit })
        );
        this.steem.getAccountHistoryAsync(this.username, from, batchLimit).then(
            (result: steem.AccountHistory.Operation[]) => {
                if (result.length == 0) {
                    this.onFinishCallback(undefined);
                } else {
                    result.reverse(); // loadFrom(from=-1) returns last "batchSize" of operations, but they are sorted from oldest to the newest.
                    // So the newest operation index is 1000 (it is a little awkward, but when limit=1000, steem returns 1001
                    // operations - it may be a bug, so I do not rely on this behavior - thats why I use result.length < batchSize instead of result.length <= batchSize) below.
                    const loadNext = this.processBatch(result);

                    if (loadNext && result.length >= this.batchSize) {
                        // not all operations were loaded
                        const from = result[result.length - 1][0] - 1; // absolute number of oldest loaded operation, minus one (remember that the result array was previously reversed)
                        this.loadFromOnlyIfConsumers(from);
                    } else {
                        this.onFinishCallback(undefined);
                    }
                }
            },
            error => {
                const continueOnThisError = this.give(error, undefined);
                if (!continueOnThisError) this.onFinishCallback(error);
            }
        );
    }

    /**
     * This is to prevent the situation in which a custom_json is placed at the end of one batch, and vote is placed at the start of the next batch.
     */
    private previousBatchLeftoverCustomJson: steem.AccountHistory.Operation | undefined = undefined;

    private processBatch(ops: steem.AccountHistory.Operation[]): boolean {
        let loadNext: boolean = true;

        if (this.previousBatchLeftoverCustomJson) {
            ops.unshift(this.previousBatchLeftoverCustomJson);
            this.previousBatchLeftoverCustomJson = undefined;
        }

        if (ops[ops.length - 1][1].op[0] === "custom_json") {
            const lastOp = ops.pop();
            this.previousBatchLeftoverCustomJson = lastOp;
        }

        const opsGroupedByTransactionNum: { [key: number]: steem.AccountHistory.Operation[] } = _.groupBy(
            ops,
            (op: steem.AccountHistory.Operation) => op[1].trx_id
        );
        /* we use trx_id as it is purely unique */

        const opsMappedToStemTransactions: UnifiedSteemTransaction[] = _.values(opsGroupedByTransactionNum) // we count only single transactions
            .map((txOps: steem.AccountHistory.Operation[]) => {
                const transaction: UnifiedSteemTransaction = {
                    block_num: txOps[0][1].block, // there is at least one operation in transaction
                    transaction_num: txOps[0][1].trx_in_block,
                    transaction_id: txOps[0][1].trx_id,
                    timestamp: new Date(txOps[0][1].timestamp + "Z"), // this is UTC time (Z marks it so that it can be converted to local time properly)
                    ops: _.reverse(txOps.map((op: steem.AccountHistory.Operation) => op[1].op)), // map operations,
                    // they have to be reversed (we want transactions from the newset to the oldest, but operations in reversed order: from the oldest to the newset)
                };
                return transaction;
            });

        const opsMappedToStemTransactionsSorted: UnifiedSteemTransaction[] = _.reverse(
            _.sortBy(opsMappedToStemTransactions, ["block_num", "transaction_num"])
        );

        opsMappedToStemTransactionsSorted.forEach(trx => {
            if (Log.log().isDebug()) {
                let hasAcceptedConfirmVote: boolean = false;
                let hasVote: boolean = false;

                if (trx.ops.filter(op => op[0] === "vote").length > 0) hasVote = true;
                if (
                    trx.ops
                        .filter(op => op[0] === "custom_json")
                        .map(op => op[1] as steem.CustomJsonOperation)
                        .filter((cjop: steem.CustomJsonOperation) => cjop.id === "wise")
                        .map(cjop => JSON.parse(cjop.json) as string[])
                        .filter(o => o[0] === "v2:confirm_vote")
                        .filter(o => (_.get(o[1], "accepted") as boolean) === true).length > 0
                )
                    hasAcceptedConfirmVote = true;

                if (hasAcceptedConfirmVote && !hasVote) {
                    Log.log().debug(
                        "STEEM_JS_ACCOUNT_HISTORY_SUPPLIER_MISSING_VOTE=" +
                            JSON.stringify(trx) +
                            "\n" +
                            "STEEM_JS_ACCOUNT_HISTORY_SUPPLIER_MISSING_VOTE_ALL_OPS=" +
                            JSON.stringify(ops)
                    );
                }
            }

            if (loadNext) loadNext = this.give(undefined, trx);
        });

        return loadNext;
    }
}
