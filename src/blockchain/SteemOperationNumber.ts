import { RawOperation } from "../types/blockchain-operations-types";

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
        else if (this.transactionNum > tn.transactionNum) return true;
        else return this.operationNum > tn.operationNum;
    }

    public isLesserThan(tn: SteemOperationNumber): boolean {
        if (this.blockNum < tn.blockNum) return true;
        else if (this.transactionNum < tn.transactionNum) return true;
        else return this.operationNum < tn.operationNum;
    }

    public isEqual(tn: SteemOperationNumber): boolean {
        return this.blockNum == tn.blockNum && this.transactionNum == tn.transactionNum && this.operationNum == tn.operationNum;
    }

    public static fromOperation(rawOp: RawOperation): SteemOperationNumber {
        return new SteemOperationNumber(rawOp[1].block, rawOp[1].trx_in_block, rawOp[1].op_in_trx);
    }
}