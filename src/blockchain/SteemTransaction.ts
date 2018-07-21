
export interface SteemTransaction {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    timestamp: Date;
    ops: [string, object][];
}