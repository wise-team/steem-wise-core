import { ChainableSupplier } from "../../chainable/Chainable";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { SteemOperation } from "../../blockchain/SteemOperation";
import { RawOperation } from "./RawOperation";
import { CustomJsonOperation } from "../../blockchain/CustomJsonOperation";

export class SteemJsAccountHistorySupplier extends ChainableSupplier<SteemOperation, SteemJsAccountHistorySupplier> {
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
        // TODO load only operations present after introduction of smartvotes
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

    private processBatch(ops: RawOperation []): boolean {
        let loadNext: boolean = true;
        for (let i = 0; i < ops.length; i++) {
            const operation: RawOperation = ops[i];
            if (operation[1].op[0] == "custom_json" && (operation[1].op[1] as CustomJsonOperation).id == "smartvote") {
                loadNext = this.give(undefined, this.convertOperation(operation));
                if (loadNext === false) break;
            }
        }
        return loadNext;
    }

    private convertOperation(op: RawOperation): SteemOperation {
        return {
            block_num: op[1].block,
            transaction_num: op[1].trx_in_block,
            transaction_id: op[1].trx_id,
            operation_num: op[1].op_in_trx,
            timestamp: new Date(op[1].timestamp + "Z"), // this is UTC time (Z marks it so that it can be converted to local time properly)
            op: op[1].op
        } as SteemOperation;
    }
}