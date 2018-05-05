import { ChainableTransformer } from "../Chainable";

import { RawOperation, CustomJsonOperation } from "../../types/blockchain-operations-types";
import { smartvotes_operation } from "../../steem-smartvotes";

/**
 * Filters out smartvotes operations.
 */
export class ToSmartvotesOperationTransformer extends ChainableTransformer<RawOperation, smartvotes_operation, ToSmartvotesOperationTransformer> {
    protected me(): ToSmartvotesOperationTransformer {
        return this;
    }

    protected take(error: Error | undefined, rawOp: RawOperation): boolean {
        if (error) throw error;

        if (rawOp[1].op[0] == "custom_json" && (rawOp[1].op[1] as CustomJsonOperation).id == "smartvote") {
            const jsonStr: string = (rawOp[1].op[1] as CustomJsonOperation).json;
            const op: smartvotes_operation = JSON.parse(jsonStr) as smartvotes_operation;
            return this.give(undefined, op);
        }
        else throw new Error("This operation is not a smartvotes operation");
    }
}