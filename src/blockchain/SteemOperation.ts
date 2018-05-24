
export interface SteemOperation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    operation_num: number;
    timestamp: Date;
    op: [string, object];
}