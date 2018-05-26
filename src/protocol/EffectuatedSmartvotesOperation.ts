import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { SmartvotesOperation } from "./SmartvotesOperation";


export interface EffectuatedSmartvotesOperation extends SmartvotesOperation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    operation_num: number;
    timestamp: Date;
}