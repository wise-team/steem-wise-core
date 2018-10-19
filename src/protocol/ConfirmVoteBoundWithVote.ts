import * as steem from "steem";
import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { VoteOperation } from "../blockchain/VoteOperation";
import { ConfirmVote } from "./ConfirmVote";

/**
 * This is a "virtual" type used by Api's to attach a vote operation (that is placed on blockchain
 * together with custom_json operation in a single transaction).
 */
export interface ConfirmVoteBoundWithVote extends ConfirmVote {
    vote: steem.VoteOperation;
}

export namespace ConfirmVoteBoundWithVote {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isConfirmVoteBoundWithVote(cmd: SetRules | SendVoteorder | ConfirmVote | ConfirmVoteBoundWithVote): cmd is ConfirmVoteBoundWithVote {
        return ConfirmVote.isConfirmVote(cmd)
        && (<ConfirmVoteBoundWithVote>cmd).vote !== undefined
        && VoteOperation.isVoteOperation((<ConfirmVoteBoundWithVote>cmd).vote);
    }
}