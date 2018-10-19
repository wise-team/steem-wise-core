import * as steem from "steem";

export namespace VoteOperation {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isVoteOperation(obj: object): obj is steem.VoteOperation {
        return (<steem.VoteOperation>obj).voter !== undefined
            && (<steem.VoteOperation>obj).author !== undefined
            && (<steem.VoteOperation>obj).permlink !== undefined
            && (<steem.VoteOperation>obj).weight !== undefined;
    }
}