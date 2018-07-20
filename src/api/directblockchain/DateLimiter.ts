import { ChainableFilter } from "../../chainable/Chainable";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { SteemOperation } from "../../blockchain/SteemOperation";

export class DateLimiter extends ChainableFilter<SteemOperation, DateLimiter> {
    private until: Date;

    constructor(until: Date) {
        super();

        this.until = until;
    }

    protected me(): DateLimiter {
        return this;
    }

    protected take(error: Error | undefined, rawOp: SteemOperation): boolean {
        if (error) throw error;

        if (rawOp.timestamp.getTime() >= (this.until.getTime() / 1000)) {
            return this.give(undefined, rawOp);
        }
        else return false;
    }
}