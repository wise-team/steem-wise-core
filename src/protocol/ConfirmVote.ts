import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";

export interface ConfirmVote {
    voteorderTxId: string;
    accepted: boolean;
    msg: string;
}

/**
 * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
 */
export function isConfirmVote(cmd: SetRules | SendVoteorder | ConfirmVote): cmd is ConfirmVote {
    return (<ConfirmVote>cmd).voteorderTxId !== undefined
        && (<ConfirmVote>cmd).accepted !== undefined
        && (<ConfirmVote>cmd).msg !== undefined;
}