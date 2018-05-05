import { RawOperation, CustomJsonOperation } from "../../../types/blockchain-operations-types";
import { ChainableFilter } from "../../Chainable";

/**
 * Filters out smartvotes operations.
 */
export class SmartvotesFilter extends ChainableFilter<RawOperation, SmartvotesFilter> {
    protected me(): SmartvotesFilter {
        return this;
    }

    public take(error: Error | undefined, rawOp: RawOperation): boolean {
        if (error) throw error;
        if (rawOp[1].op[0] == "custom_json" && (rawOp[1].op[1] as CustomJsonOperation).id == "smartvote") {
            return this.give(undefined, rawOp);
        }
        else return true;
    }
}