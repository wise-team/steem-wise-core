import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { ConfirmVote } from "./ConfirmVote";
import { ConfirmVoteBoundWithVote } from "./ConfirmVoteBoundWithVote";


export interface WiseOperation {
    voter: string;
    delegator: string;

    command: SetRules | SendVoteorder | ConfirmVote | ConfirmVoteBoundWithVote; /* an Api should
                                                    attach vote operation data to ConfirmVote */
}