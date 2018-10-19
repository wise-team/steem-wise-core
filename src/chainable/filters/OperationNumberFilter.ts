import { ChainableFilter } from "../Chainable";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { UnifiedSteemTransaction } from "../../blockchain/UnifiedSteemTransaction";

export class OperationNumberFilter extends ChainableFilter<UnifiedSteemTransaction, OperationNumberFilter> {
    private tn: SteemOperationNumber;
    private mode: "<" | "<_solveOpInTrxBug" | "<=" | ">" | ">=";
    private limiter: boolean = false;

    constructor(mode: "<" | "<_solveOpInTrxBug" | "<=" | ">" | ">=", tn: SteemOperationNumber) {
        super();
        this.mode = mode;
        this.tn = tn;
    }

    protected me(): OperationNumberFilter {
        return this;
    }

    protected take(error: Error | undefined, rawTx: UnifiedSteemTransaction): boolean {
        if (error) throw error;

        const tn = SteemOperationNumber.fromTransaction(rawTx);

        if (this.mode === "<" && tn.isLesserThan(this.tn)) {
            return this.give(undefined, rawTx);
        }
        else if (this.mode === "<_solveOpInTrxBug" && tn.isLesserThan_solveOpInTrxBug(this.tn)) {
            return this.give(undefined, rawTx);
        }
        else if (this.mode === "<=" && (tn.isLesserThan(this.tn) || tn.isEqual(this.tn))) {
            return this.give(undefined, rawTx);
        }
        else if (this.mode === ">" && tn.isGreaterThan(this.tn)) {
            return this.give(undefined, rawTx);
        }
        else if (this.mode === ">=" && (tn.isGreaterThan(this.tn) || tn.isEqual(this.tn))) {
            return this.give(undefined, rawTx);
        }
        else {
            return !this.limiter; // true if filter, false if limiter
        }
    }

    public makeLimiter(): OperationNumberFilter {
        this.limiter = true;
        return this;
    }
}