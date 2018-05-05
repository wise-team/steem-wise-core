import { RawOperation, CustomJsonOperation } from "../../types/blockchain-operations-types";
import { Supplier } from "../Supplier";
import { Consumer } from "../Consumer";
import { ChainableFilter } from "./ChainableFilter";

/**
 * Filters out smartvotes operations.
 */
export class SmartvotesFilter extends ChainableFilter<RawOperation> {
    public static filterFunction(rawOp: RawOperation): boolean {
        return rawOp[1].op[0] == "custom_json" && (rawOp[1].op[1] as CustomJsonOperation).id == "smartvote";
    }

    public addConsumer(consumer: Consumer<RawOperation>): SmartvotesFilter {
        super.addConsumer(consumer);
        return this;
    }

    protected getMyFilterFunction(): ((item: RawOperation) => boolean) {
        return SmartvotesFilter.filterFunction;
    }
}