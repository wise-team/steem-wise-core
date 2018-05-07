import { ChainableTransformer } from "../Chainable";

import { RawOperation, CustomJsonOperation } from "../../types/blockchain-operations-types";
import { smartvotes_operation } from "../../steem-smartvotes";

/**
 * Filters out smartvotes operations.
 */
export class BiTransformer extends ChainableTransformer<RawOperation, {rawOp: RawOperation, op: smartvotes_operation}, BiTransformer> {
    protected me(): BiTransformer {
        return this;
    }

    protected take(error: Error | undefined, rawOp: RawOperation): boolean {
        if (error) throw error;

        if (rawOp[1].op[0] == "custom_json" && (rawOp[1].op[1] as CustomJsonOperation).id == "smartvote") {
            const jsonStr: string = (rawOp[1].op[1] as CustomJsonOperation).json;
            const op: smartvotes_operation = JSON.parse(jsonStr) as smartvotes_operation;
            return this.give(undefined, {rawOp: rawOp, op: op});
        }
        else throw new Error("This operation is not a smartvotes operation");
    }
}