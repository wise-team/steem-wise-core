/* tslint:disable:class-name */

/**
 * Schema for sending a single vote order.
 */
export interface smartvotes_voteorder {
    /**
     * Author of the post.
     */
    author: string;

    /**
     * Permalink of the post.
     */
    permlink: string;

    /**
     * Username of your delegator (a person, who allowed you to vote on his/her behalf.
     */
    delegator: string;

    /**
     * Weight of the upvote or flag.
     */
    weight: smartvotes_vote_weight;

    /**
     * Type of vote: an upvote or a flag.
     */
    type: "upvote" | "flag";
}

/**
 * Weight of the upvote or flag. 0 = 0%, 10000 = 100%.
 *
 * @minimum 0
 * @maximum 10000
 * @TJS-type integer
 */
export type smartvotes_vote_weight = number;