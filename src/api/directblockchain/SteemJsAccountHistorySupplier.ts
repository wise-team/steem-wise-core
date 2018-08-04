import * as _ from "lodash";
import { ChainableSupplier } from "../../chainable/Chainable";
import { SteemTransaction } from "../../blockchain/SteemTransaction";
import { Util } from "../../util/util";
import { CustomJsonOperation } from "../../blockchain/CustomJsonOperation";

export class SteemJsAccountHistorySupplier extends ChainableSupplier<SteemTransaction, SteemJsAccountHistorySupplier> {
    private steem: any;
    private username: string;
    private batchSize: number = 1000;
    private onFinishCallback: () => void;

    constructor(steem: any, username: string) {
        super();
        this.steem = steem;
        this.username = username;
        this.onFinishCallback = function(): void {};

        if (!this.steem) throw new Error("Supplied steem object is null");
    }

    protected me(): SteemJsAccountHistorySupplier {
        return this;
    }

    public withBatchSize(batchSize: number): SteemJsAccountHistorySupplier {
        this.batchSize = batchSize;
        return this;
    }

    public onFinish(callback: () => void): SteemJsAccountHistorySupplier {
        this.onFinishCallback = callback;
        return this;
    }

    public start(callback?: () => void) {
        if (callback) {
            this.onFinishCallback = callback;
        }
        // load and iterate over blockchain
        this.loadFromOnlyIfConsumers(-1);
    }

    private loadFromOnlyIfConsumers(from: number): void {
        if (this.shouldLoadNewItems()) {
            this.loadFrom(from);
        }
    }

    private loadFrom(from: number) {
        // Sometimes at the end of account history "from" can be lower than 1000. In that case we should set limit to "from". It will simply load operations including the oldest one.
        const batchLimit = (from === -1 ? this.batchSize : Math.min(this.batchSize, from));

        this.steem.api.getAccountHistory(this.username, from, batchLimit, (error: Error, result: any) => {
            if (error) {
                this.give(error, undefined);
            }
            else {
                if (result.length == 0) {
                    this.onFinishCallback();
                }
                else {
                    result.reverse(); // loadFrom(from=-1) returns last "batchSize" of operations, but they are sorted from oldest to the newest.
                    // So the newest operation index is 1000 (it is a little awkward, but when limit=1000, steem returns 1001
                    // operations — it may be a bug, so I do not rely on this behavior — thats why I use result.length < batchSize instead of result.length <= batchSize) below.
                    const loadNext = this.processBatch(result);

                    if (loadNext && result.length >= this.batchSize) { // not all operations were loaded
                        const from = result[result.length - 1][0] - 1; // absolute number of oldest loaded operation, minus one (remember that the result array was previously reversed)
                        this.loadFromOnlyIfConsumers(from);
                    }
                    else {
                        this.onFinishCallback();
                    }
                }
            }
        });
    }

    /**
     * This is to prevent the situation in which a custom_json is placed at the end of one batch, and vote is placed at the start of the next batch.
     */
    private previousBatchLeftoverCustomJson: RawOperation | undefined = undefined;

    private processBatch(ops: RawOperation []): boolean {
        let loadNext: boolean = true;

        if (this.previousBatchLeftoverCustomJson) {
            ops.unshift(this.previousBatchLeftoverCustomJson);
            this.previousBatchLeftoverCustomJson = undefined;
        }

        if (ops[ops.length - 1][1].op[0] === "custom_json") {
            const lastOp: RawOperation = ops.pop() as RawOperation;
            this.previousBatchLeftoverCustomJson = lastOp;
        }

        const opsGroupedByTransactionNum: { [key: number]: RawOperation [] }
            = _.groupBy(ops, (op: RawOperation) => op[1].trx_id);
            /* we use trx_id as it is purely unique */

        const opsMappedToStemTransactions: SteemTransaction []
            = _.values(opsGroupedByTransactionNum) // we count only single transactions
            .map((txOps: RawOperation []) => {
                const transaction: SteemTransaction = {
                    block_num: txOps[0][1].block, // there is at least one operation in transaction
                    transaction_num: txOps[0][1].trx_in_block,
                    transaction_id: txOps[0][1].trx_id,
                    timestamp: new Date(txOps[0][1].timestamp + "Z"), // this is UTC time (Z marks it so that it can be converted to local time properly)
                    ops: _.reverse(txOps.map((op: RawOperation) => op[1].op)) // map operations,
                    // they have to be reversed (we want transactions from the newset to the oldest, but operations in reversed order: from the oldest to the newset)
                };
                return transaction;
            });

        const opsMappedToStemTransactionsSorted: SteemTransaction []
            = _.reverse(_.sortBy(opsMappedToStemTransactions, ["block_num", "transaction_num"]));

        opsMappedToStemTransactionsSorted.forEach(trx => {
            let hasAcceptedConfirmVote: boolean = false;
            let hasVote: boolean = false;

            if (trx.ops.filter(op => op[0] === "vote").length > 0) hasVote = true;
            if (trx.ops.filter(op => op[0] === "custom_json")
                .map(op => op[1] as CustomJsonOperation)
                .filter((cjop: CustomJsonOperation) => cjop.id === "wise")
                .map(cjop => JSON.parse(cjop.json) as string [])
                .filter(o => o[0] === "v2:confirm_vote")
                .filter(o => _.get(o[1], "accepted") as boolean === true).length > 0) hasAcceptedConfirmVote = true;

            if (hasAcceptedConfirmVote && !hasVote) {
                Util.cheapDebug(() => "STEEM_JS_ACCOUNT_HISTORY_SUPPLIER_MISSING_VOTE=" + JSON.stringify(trx));
                Util.cheapDebug(() => "STEEM_JS_ACCOUNT_HISTORY_SUPPLIER_MISSING_VOTE_ALL_OPS=" + JSON.stringify(ops));
            }

            if (loadNext) loadNext = this.give(undefined, trx);
        });

        return loadNext;
    }
}

export type RawOperation =
    [
        number,
        {
            block: number,
            op: [string, object],
            op_in_trx: number,
            timestamp: string,
            trx_id: string,
            trx_in_block: number,
            virtual_op: number
        }
    ];