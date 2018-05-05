// TODO

import { Supplier } from "./Supplier";
import { Consumer } from "./Consumer";
import { smartvotes_operation } from "../steem-smartvotes";
import { RawOperation } from "../types/blockchain-operations-types";

export class AccountHistorySupplier {
    private steem: any;
    private username: string;
    private limit: number = Infinity;
    private batchSize: number = 1000;
    // private ascending = true;
    private filters: ((rawOp: RawOperation) => boolean) [];
    private onEmptyResultCallback: () => void;
    private onFinishCallback: () => void;
    private onErrorCallback: (error: Error) => void;

    private supplier: Supplier<RawOperation> = new Supplier<RawOperation>();

    private resultCounter: number = 0;

    constructor(steem: any, username: string) {
        this.steem = steem;
        this.username = username;

        this.filters = [];

        this.onEmptyResultCallback = function(): void {};
        this.onFinishCallback = function(): void {};
        this.onErrorCallback = function(error: Error): void {};
    }

    public withLimit(limit: number): AccountHistorySupplier {
        this.limit = limit;
        return this;
    }

    public withBatchSize(batchSize: number): AccountHistorySupplier {
        this.batchSize = batchSize;
        return this;
    }

    /*public withOrder(order: "ascending" | "descending"): AccountHistorySupplier {
        if (order === "ascending") this.ascending = true;
        else if (order === "descending") this.ascending = false;
        else throw new Error("Invalid order");
        return this;
    }*/

    public addFilter(filter: (rawOp: RawOperation) => boolean): AccountHistorySupplier {
        this.filters.push(filter);
        return this;
    }

    public addConsumer(consumer: Consumer<RawOperation>): AccountHistorySupplier {
        this.supplier.addConsumer(consumer);
        return this;
    }

    public onEmptyResult(callback: () => void): AccountHistorySupplier {
        this.onEmptyResultCallback = callback;
        return this;
    }

    public onError(callback: (error: Error) => void): AccountHistorySupplier {
        this.onErrorCallback = callback;
        return this;
    }

    public onFinish(callback: () => void): AccountHistorySupplier {
        this.onFinishCallback = callback;
        return this;
    }

    public start() {
        // load and iterate over blockchain
        this.loadFromOnlyIfConsumers(-1);
    }

    private loadFromOnlyIfConsumers(from: number): void {
        if (this.supplier.shouldLoadNewItems()) {
            this.loadFrom(from);
        }
    }

    private loadFrom(from: number) {
        // TODO add some rate limiting for most frequent operations
        // TODO load only operations present after introduction of smartvotes

        // Sometimes at the end of account history "from" can be lower than 1000. In that case we should set limit to "from". It will simply load operations including the oldest one.
        const batchLimit = (from === -1 ? this.batchSize : Math.min(this.batchSize, from));

        this.steem.api.getAccountHistory(this.username, from, batchLimit, (error: Error, result: any) => {
            if (error) {
                this.supplier.notifyConsumers(error, undefined);
                this.onErrorCallback(error);
            }
            else {
                if (result.length == 0) this.onEmptyResultCallback();
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
            if (this.filter(operation)) {
                loadNext = this.supplier.notifyConsumers(undefined, operation);
                if (!loadNext) break;

                if (this.limit !== Infinity) {
                    this.resultCounter++;
                    if (this.resultCounter >= this.limit) {
                        loadNext = false;
                        break;
                    }
                }
            }
        }
        return loadNext;
    }

    private filter(op: RawOperation): boolean {
        for (let i = 0; i < this.filters.length; i++) {
            if (!this.filters[i](op)) return false;
        }
        return true;
    }
}