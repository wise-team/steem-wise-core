import { RawOperation, CustomJsonOperation } from "../../../types/blockchain-operations-types";
import { ChainableFilter } from "../../Chainable";

/**
 * Filters out blockchain operations older that this date.
 */
export class DateFilter extends ChainableFilter<RawOperation, DateFilter> {
    private beforeDate: Date;

    constructor(beforeDate: Date) {
        super();
        this.beforeDate = beforeDate;
    }

    protected me(): DateFilter {
        return this;
    }

    protected take(error: Error | undefined, rawOp: RawOperation): boolean {
        if (error) throw error;
        if (!(Date.parse(rawOp[1].timestamp + "Z"/* Z means UTC */) > this.beforeDate.getTime())) {
            return this.give(undefined, rawOp);
        }
        else return true;
    }
}