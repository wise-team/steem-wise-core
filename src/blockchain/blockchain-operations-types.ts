export type RawOperation = // TODO rename to BlockchainEntry or BlockchainOperationDescriptor
    [
        number,
        {
            block: number,
            op: [string, object],
            op_in_trx: number,
            timestamp: string,
            trx_id: string,
            trx_in_block: number,
            virtual_op: number
        }
    ];
/*
export interface VoteOperation {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
}*/