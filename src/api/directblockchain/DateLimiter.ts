import { ChainableFilter } from "../../chainable/Chainable";
import { UnifiedSteemTransaction } from "../../blockchain/UnifiedSteemTransaction";

export class DateLimiter extends ChainableFilter<UnifiedSteemTransaction, DateLimiter> {
    private until: Date;

    constructor(until: Date) {
        super();

        this.until = until;
    }

    protected me(): DateLimiter {
        return this;
    }

    protected take(error: Error | undefined, comparedTx: UnifiedSteemTransaction): boolean {
        if (error) throw error;

        if (comparedTx.timestamp.getTime() >= this.until.getTime()) {
            return this.give(undefined, comparedTx);
        }
        else {
            return false;
        }
    }
}