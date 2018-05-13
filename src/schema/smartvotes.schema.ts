/* tslint:disable:class-name */

/*
 * These are the interfaces for smartvotes custom_json operation formatting.
 * Such formatted commands are then sent or received to/from steem blockchain.
 * NOTICE: Smartvotes interfaces are under early development. They may change over time.
 */

import { smartvotes_ruleset } from "./rules.schema";
import { smartvotes_voteorder } from "./votes.schema";

/**
 * General type for every smartvotes operation. If an custom_json operation on steem blockchain has
 * an id=smartvote parameter it is going to be parsed as a smartvotes operation using the following schema:
 */
export type smartvotes_operation = smartvotes_command_set_rules | smartvotes_command_send_voteorder | smartvotes_command_confirm_votes;

// TODO separate set_rules for every voter (8kb limit https://github.com/steemit/steem/commit/81f4c6373f1ddeb8c435b5c91fa67bcd361e29a3#diff-04f6af9cdbf180a31ccdbf6335b8f240R1517)
/**
 * This command sets the rules. It invalidates previous rules. For a voteorder
 * a binding set_rules command has to be determined. It is the newest set_rules command
 * posted by the delegator to the Blockchain BEFORE the voteorder was sent.
 */
export interface smartvotes_command_set_rules {
    name: "set_rules";

    /**
     * List of named rulesets.
     */
    rulesets: smartvotes_ruleset [];
}

/**
 * This command sends a voteorder.
 */
export interface smartvotes_command_send_voteorder {
    name: "send_voteorder";

    /**
     * A voteorder to be sent.
     */
    voteorder: smartvotes_voteorder;
}

/**
 * This command confirms that a vote order has been accomplished.
 */
export interface smartvotes_command_confirm_votes {
    name: "confirm_votes";

    /**
     * Transaction id & num of operation in transaction of a voteorder.
     */
    voteorders: {
        transaction_id: string;
        operation_num: number;
        invalid: boolean;
    } [];
}


export { smartvotes_ruleset, smartvotes_rule, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc, smartvotes_custom_rpc_call,
    smartvotes_custom_rpc_call_parameters } from "./rules.schema";

export { smartvotes_voteorder, smartvotes_vote_weight } from "./votes.schema";