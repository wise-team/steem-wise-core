import * as steem from "steem";
import { SteemSmartvotes, smartvotes_operation } from "../steem-smartvotes";
import { RawOperation } from "../types/blockchain-operations-types";

export class AccountIterator {
    private steem: any;
    private username: string;
    private limit: number = Infinity;
    private batchSize: number = 1000;
    private ascending = true;
    private rawFilter: (rawOp: RawOperation) => boolean;
    private smartvotesFilter: (op: smartvotes_operation) => boolean;
    private callback: (error: Error | undefined, op: smartvotes_operation) => boolean;

    constructor(steem: any, username: string) {
        this.steem = steem;
        this.username = username;

        this.rawFilter = function(rawOp: RawOperation): boolean {
            return true;
        };

        this.smartvotesFilter = function(op: smartvotes_operation): boolean {
            return true;
        };

        this.callback = function(error: Error | undefined, op: smartvotes_operation): boolean {
            return false;
        };
    }

    public withLimit(limit: number): AccountIterator {
        this.limit = limit;
        return this;
    }

    public withBatchSize(batchSize: number): AccountIterator {
        this.batchSize = batchSize;
        return this;
    }

    public withOrder(order: "ascending" | "descending"): AccountIterator {
        if (order === "ascending") this.ascending = true;
        else if (order === "descending") this.ascending = false;
        else throw new Error("Invalid order");
        return this;
    }

    public withRawFilter(filter: (rawOp: RawOperation) => boolean): AccountIterator {
        this.rawFilter = filter;
        return this;
    }

    public withSmartvotesFilter(filter: (op: smartvotes_operation) => boolean): AccountIterator {
        this.smartvotesFilter = filter;
        return this;
    }

    public forEach(callback: (error: Error | undefined, op: smartvotes_operation) => boolean): void {
        this.callback = callback;

        // load and iterate over blockchain
    }
}