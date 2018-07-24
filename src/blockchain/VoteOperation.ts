export interface VoteOperation {
    voter: string;
    author: string;
    permlink: string;
    weight: number;
}

/**
 * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
 */
export function isVoteOperation(obj: object): obj is VoteOperation {
    return (<VoteOperation>obj).voter !== undefined
        && (<VoteOperation>obj).author !== undefined
        && (<VoteOperation>obj).permlink !== undefined
        && (<VoteOperation>obj).weight !== undefined;
}