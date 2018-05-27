/* tslint:disable class-name */

import { wise_rule } from "./rules-schema";

export type wise_operation =
            wise_send_voteorder_operation
          | wise_set_rules_operation
          | wise_confirm_vote_operation;

export type wise_send_voteorder_operation = ["v2:send_voteorder", wise_send_voteorder];
export type wise_set_rules_operation = ["v2:set_rules", wise_set_rules];
export type wise_confirm_vote_operation = ["v2:confirm_vote", wise_confirm_vote];

export interface wise_confirm_vote {
    voter: string;
    tx_id: string;
    msg: string;
    accepted: boolean;
}

export interface wise_set_rules {
    voter: string;
    rulesets: [string, wise_rule []][];
}

export interface wise_send_voteorder {
    delegator: string;
    ruleset: string;
    permlink: string;
    author: string;

    /**
     * Vote / flag weight
     *
     * @minimum -10000
     * @maximum 10000
     * @TJS-type integer
     */
    weight: number;
}

export { wise_rule } from "./rules-schema";

// TODO voting_power of delegator rule
// TODO weight rule (per rule & per delegator)
// TODO rule: maksymalna wartosc postu