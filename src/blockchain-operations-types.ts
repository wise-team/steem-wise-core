export type RawOperation = [number, {block: number, op: [string, CustomJsonOperation], op_in_trx: number, timestamp: string, trx_id: string, trx_in_block: number, virtual_op: number}];

export type CustomJsonOperation = {
    id: string;
    json: string;
    required_auths: string [];
    required_posting_auths: string [];
};