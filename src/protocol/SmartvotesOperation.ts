import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";


export interface SmartvotesOperation {
    voter: string;
    delegator: string;

    command: SetRules | SendVoteorder;
}