import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { ConfirmVote, ConfirmVoteBoundWithVote } from "./ConfirmVote";


export interface WiseOperation {
    voter: string;
    delegator: string;

    command: SetRules | SendVoteorder | ConfirmVote | ConfirmVoteBoundWithVote; /* an Api should
                                                    attach vote operation data to ConfirmVote */
}