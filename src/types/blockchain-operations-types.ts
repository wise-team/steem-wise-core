export type RawOperation =
    [
        number,
        {
            block: number,
            op: [string, CustomJsonOperation | VoteOperation | object],
            op_in_trx: number,
            timestamp: string,
            trx_id: string,
            trx_in_block: number,
            virtual_op: number
        }
    ];

export type CustomJsonOperation = {
    id: string;
    json: string;
    required_auths: string [];
    required_posting_auths: string [];
};

export interface VoteOperation {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
}

export interface SteemPost {
    id: number;
    author: string;
    permlink: string;
    category: string;
    title: string;
    body: string;
    json_metadata: string;
    last_update: string;
    created: string;
    active: string;
    last_payout: string;
    [x: string]: any; // allows other properties
}

export interface SteemPostJSONMetadata {
    tags: string [];
    [x: string]: any; // allows other properties
}