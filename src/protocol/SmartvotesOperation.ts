import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";


export interface SmartvotesOperation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    operation_num: number;
    timestamp: Date;

    voter: string;
    delegator: string;

    command: SetRules | SendVoteorder;
}