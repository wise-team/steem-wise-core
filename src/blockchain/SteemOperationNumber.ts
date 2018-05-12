import { RawOperation } from "./blockchain-operations-types";

export class SteemOperationNumber {
    public blockNum: number;
    public transactionNum: number;
    public operationNum: number;

    public static FUTURE: SteemOperationNumber = new SteemOperationNumber(Infinity, Infinity, Infinity);

    constructor(blockNum: number, transactionNum: number, operationNum: number) {
        this.blockNum = blockNum;
        this.transactionNum = transactionNum;
        this.operationNum = operationNum;
    }

    public isGreaterThan(tn: SteemOperationNumber): boolean {
        if (this.blockNum > tn.blockNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum > tn.transactionNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum == tn.transactionNum) return this.operationNum > tn.operationNum;
        else return false;
    }

    public isGreaterOrEqual(tn: SteemOperationNumber): boolean {
        if (this.blockNum > tn.blockNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum > tn.transactionNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum == tn.transactionNum) return this.operationNum >= tn.operationNum;
        else return false;
    }

    public isLesserThan(tn: SteemOperationNumber): boolean {
        if (this.blockNum < tn.blockNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum < tn.transactionNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum == tn.transactionNum) return this.operationNum < tn.operationNum;
        else return false;
    }

    public isLesserOrEqual(tn: SteemOperationNumber): boolean {
        if (this.blockNum < tn.blockNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum < tn.transactionNum) return true;
        else if (this.blockNum == tn.blockNum && this.transactionNum == tn.transactionNum) return this.operationNum <= tn.operationNum;
        else return false;
    }

    public isEqual(tn: SteemOperationNumber): boolean {
        return this.blockNum == tn.blockNum && this.transactionNum == tn.transactionNum && this.operationNum == tn.operationNum;
    }

    public toString(): string {
        return "[b=" + this.blockNum + ", tx=" + this.transactionNum + ", op=" + this.operationNum + "]";
    }

    /**
     * There is a bug in account_history api: op_in_trx is always zero in returned operations.
     * This prevents proper comparison of SteemOperationNumbers. Thuswe have to use the following hack in some places.
     * Issue: https://github.com/steemit/steem/issues/2272 It is solved, but in api.steemit.com endpoint the bug still exists.
     * TODO: Stop using this function when the bug is solved.
     */
    public previousTransaction(): SteemOperationNumber {

    }

    public static fromOperation(rawOp: RawOperation): SteemOperationNumber {
        return new SteemOperationNumber(rawOp[1].block, rawOp[1].trx_in_block, rawOp[1].op_in_trx);
    }
}