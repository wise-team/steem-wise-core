// TODO

import { ChainableSupplier } from "../Chainable";
import { smartvotes_operation } from "../../steem-smartvotes";
import { RawOperation } from "../../blockchain/blockchain-operations-types";

export class AccountHistorySupplier extends ChainableSupplier<RawOperation, AccountHistorySupplier> {
    private steem: any;
    private username: string;
    private batchSize: number = 1000;
    private onFinishCallback: () => void;

    constructor(steem: any, username: string) {
        super();
        this.steem = steem;
        this.username = username;
        this.onFinishCallback = function(): void {};
    }

    protected me(): AccountHistorySupplier {
        return this;
    }

    public withBatchSize(batchSize: number): AccountHistorySupplier {
        this.batchSize = batchSize;
        return this;
    }

    public onFinish(callback: () => void): AccountHistorySupplier {
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
        // TODO add some rate limiting for most frequent operations
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
            loadNext = this.give(undefined, operation);
            if (loadNext === false) break;
        }
        return loadNext;
    }
}