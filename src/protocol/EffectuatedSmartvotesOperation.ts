import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { SmartvotesOperation } from "./SmartvotesOperation";

// TODO: introduce SteemOperationNumber
export interface EffectuatedSmartvotesOperation extends SmartvotesOperation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    operation_num: number;
    timestamp: Date;
}