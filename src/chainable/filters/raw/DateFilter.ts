import { RawOperation, CustomJsonOperation } from "../../../types/blockchain-operations-types";
import { Supplier } from "../../Supplier";
import { Consumer } from "../../Consumer";
import { ChainableFilter } from "../ChainableFilter";

/**
 * Filters out blockchain operations older that this date.
 */
export class DateFilter extends ChainableFilter<RawOperation> {
    private beforeDate: Date;

    constructor(beforeDate: Date) {
        super();
        this.beforeDate = beforeDate;
    }

    protected getMyFilterFunction(): ((rawOp: RawOperation) => boolean) {
        return (rawOp: RawOperation): boolean => {
            return !(Date.parse(rawOp[1].timestamp + "Z"/* Z means UTC */) > this.beforeDate.getTime());
        };
    }
}