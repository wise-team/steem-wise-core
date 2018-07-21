import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { VoteOperation } from "../blockchain/VoteOperation";

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

/**
 * This is a "virtual" type used by Api's to attach a vote operation (that is placed on blockchain
 * together with custom_json operation in a single transaction).
 */
export interface ConfirmVoteBoundWithVote extends ConfirmVote {
    vote: VoteOperation;
}

/**
 * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
 */
export function isConfirmVoteBoundWithVote(cmd: SetRules | SendVoteorder | ConfirmVote | ConfirmVoteBoundWithVote): cmd is ConfirmVoteBoundWithVote {
    return isConfirmVote(cmd) && (<ConfirmVoteBoundWithVote>cmd).vote !== undefined;
}