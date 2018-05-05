import { RawOperation, CustomJsonOperation } from "../../types/blockchain-operations-types";
import { Supplier } from "../Supplier";
import { Consumer } from "../Consumer";
import { ChainableTransformer } from "./ChainableTransformer";
import { smartvotes_operation } from "../../steem-smartvotes";

/**
 * Filters out smartvotes operations.
 */
export class ToSmartvotesOperationTransformer extends ChainableTransformer<RawOperation, smartvotes_operation> {
    protected getMyTransformFunction(): ((rawOp: RawOperation) => smartvotes_operation) {
        return (rawOp: RawOperation): smartvotes_operation => {
            if (rawOp[1].op[0] == "custom_json" && (rawOp[1].op[1] as CustomJsonOperation).id == "smartvote") {
                const jsonStr: string = (rawOp[1].op[1] as CustomJsonOperation).json;
                const op: smartvotes_operation = JSON.parse(jsonStr) as smartvotes_operation;
                return op;
            }
            else throw new Error("This operation is not a smartvotes operation");
        };

    }
}