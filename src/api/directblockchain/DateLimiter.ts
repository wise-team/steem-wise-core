import { ChainableFilter } from "../../chainable/Chainable";
import { SteemTransaction } from "../../blockchain/SteemTransaction";

export class DateLimiter extends ChainableFilter<SteemTransaction, DateLimiter> {
    private until: Date;

    constructor(until: Date) {
        super();

        this.until = until;
    }

    protected me(): DateLimiter {
        return this;
    }

    protected take(error: Error | undefined, rawTx: SteemTransaction): boolean {
        if (error) throw error;

        if (rawTx.timestamp.getTime() >= (this.until.getTime() / 1000)) {
            return this.give(undefined, rawTx);
        }
        else return false;
    }
}