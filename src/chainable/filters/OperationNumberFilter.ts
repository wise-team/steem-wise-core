import { ChainableFilter } from "../Chainable";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { SteemOperation } from "../../blockchain/SteemOperation";

export class OperationNumberFilter extends ChainableFilter<SteemOperation, OperationNumberFilter> {
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

    protected take(error: Error | undefined, rawOp: SteemOperation): boolean {
        if (error) throw error;

        const tn = SteemOperationNumber.fromOperation(rawOp);

        if (this.mode === "<" && tn.isLesserThan(this.tn)) {
            return this.give(undefined, rawOp);
        }
        else if (this.mode === "<_solveOpInTrxBug" && tn.isLesserThan_solveOpInTrxBug(this.tn)) {
            return this.give(undefined, rawOp);
        }
        else if (this.mode === "<=" && (tn.isLesserThan(this.tn) || tn.isEqual(this.tn))) {
            return this.give(undefined, rawOp);
        }
        else if (this.mode === ">" && tn.isGreaterThan(this.tn)) {
            return this.give(undefined, rawOp);
        }
        else if (this.mode === ">=" && (tn.isGreaterThan(this.tn) || tn.isEqual(this.tn))) {
            return this.give(undefined, rawOp);
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