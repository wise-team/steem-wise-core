import { RawOperation, CustomJsonOperation } from "../../../blockchain/blockchain-operations-types";
import { SteemOperationNumber } from "../../../blockchain/SteemOperationNumber";
import { ChainableFilter } from "../../Chainable";

/**
 * Filters out blockchain operations older that this date.
 */
export class OperationNumberFilter extends ChainableFilter<RawOperation, OperationNumberFilter> {
    private tn: SteemOperationNumber;
    private mode: "<" | "<_solveOpInTrxBug" | "<=" | ">" | ">=";

    constructor(mode: "<" | "<_solveOpInTrxBug" | "<=" | ">" | ">=", tn: SteemOperationNumber) {
        super();
        this.mode = mode;
        this.tn = tn;
    }

    protected me(): OperationNumberFilter {
        return this;
    }

    protected take(error: Error | undefined, rawOp: RawOperation): boolean {
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
            return true; // this is filter
        }
    }
}