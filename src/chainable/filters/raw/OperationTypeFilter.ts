import { RawOperation, CustomJsonOperation } from "../../../types/blockchain-operations-types";
import { Supplier } from "../../Supplier";
import { Consumer } from "../../Consumer";
import { ChainableFilter } from "../ChainableFilter";

/**
 * Filters steem blockchain operations by type.
 */
export class OperationTypeFilter extends ChainableFilter<RawOperation> {
    private typeName: string;

    constructor(typeName: string) {
        super();
        this.typeName = typeName;
    }

    protected getMyFilterFunction(): ((rawOp: RawOperation) => boolean) {
        return (rawOp: RawOperation): boolean => {
            return rawOp[1].op[0] == this.typeName;
        };
    }
}