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
 * an id=smartvote parameter: it is going to be parsed as a smartvotes operation using the following schema:
 */
export interface smartvotes_operation {
    /**
     *
     */
    type: "smartvote";

    /**
     * This is a smartvotes command. There are two types of commands: set_rules and send_votes.
     */
    command: smartvotes_command_set_rules | smartvotes_command_send_voteorders;
}

export interface smartvotes_command_set_rules {
    name: "set_rules";
    rulesets: smartvotes_ruleset [];
}

export interface smartvotes_command_send_voteorders {
    name: "send_voteorders";
    voteorders: smartvotes_voteorder [];
}

export { smartvotes_ruleset, smartvotes_rule, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc, smartvotes_custom_rpc_call,
    smartvotes_custom_rpc_call_parameters } from "./rules.schema";

export { smartvotes_voteorder, smartvotes_vote_weight } from "./votes.schema";