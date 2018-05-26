import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { ConfirmVote } from "./ConfirmVote";


export interface SmartvotesOperation {
    voter: string;
    delegator: string;

    command: SetRules | SendVoteorder | ConfirmVote;
}