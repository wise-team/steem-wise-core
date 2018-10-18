
import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { ConfirmVote } from "./ConfirmVote";
import { ConfirmVoteBoundWithVote } from "./ConfirmVoteBoundWithVote";

export type WiseCommand = SetRules | SendVoteorder | ConfirmVote | ConfirmVoteBoundWithVote; /* an Api should
                    attach vote operation data to ConfirmVote */

export namespace WiseCommand {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isWiseCommand(o: any): o is WiseCommand {
        return typeof o === "object"
            && (
                SetRules.isSetRules(o) ||
                SendVoteorder.isSendVoteorder(o) ||
                ConfirmVote.isConfirmVote(o) ||
                ConfirmVoteBoundWithVote.isConfirmVoteBoundWithVote(o)
            )
        ;
    }
}