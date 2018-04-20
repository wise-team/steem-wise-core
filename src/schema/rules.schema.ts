/* tslint:disable:class-name */

import { smartvotes_vote_weight, smartvotes_voteorder } from "./votes.schema";

/**
 * This is a named set of rules, which have to be fulfilled by an article supplied by a voter.
 * The delegator can define rulesets for several users, and several rulesets for each single user.
 * Rules in the ruleset are checked using AND boolean operator. They have to be all fulfilled for the vote to be cast.
 */
export interface smartvotes_ruleset {
    /**
     * Unique name of a ruleset. A voter selects one of the rulesets available for him. This information is passed
     * with an voteorder.
     */
    name: string;

    /**
     * Voter's username.
     */
    voter: string;

    /**
     * Total weight of all votes that a voter can cast.
     * Eg.: 10000 means a single 100% vote, or twenty 5% votes.
     * If you want to allow a voter to cast two 100% votes, total_weight should be a sum: 20000.
     */
    total_weight: smartvotes_vote_weight;

    /**
     * Array of rules, that will be checked using AND boolean operator. An rule should implement smartvotes_rule type.
     * smartvotes_rule type simply connects the following rule types: smartvotes_rule_tags,
     * smartvotes_rule_authors, smartvotes_rule_custom_rpc.
     */
    rules: smartvotes_rule [];
}


/**
 * A type which connects allowed rule interfaces. These are: smartvotes_rule_tags,
 * smartvotes_rule_authors, smartvotes_rule_custom_rpc.
 */
export type smartvotes_rule = smartvotes_rule_tags
    | smartvotes_rule_authors
    | smartvotes_rule_custom_rpc
    ;


/**
 * A rule for specifying all allowed or denied tags.
 */
export interface smartvotes_rule_tags {
    type: "tags";
    mode: "allow" | "deny";

    /**
     * List of tags checked using boolean OR.
     */
    tags: string [];
}

/**
 * A rule for specifying allowed or denied authors.
 */
export interface smartvotes_rule_authors {
    type: "authors";
    mode: "allow" | "deny";

    /**
     * List of authors checked using boolean OR.
     */
    authors: string [];
}

/**
 * A rule, which allows using custom JSON-RPC for post validation. When user
 * browses posts / votes / before sending a vote based on a voteorder — a call will be performed.
 * RPC should return boolean true or false indicating potential vote validity.
 */
export interface smartvotes_rule_custom_rpc {
    type: "custom_rpc";
    rpc_host: string;
    rpc_port: number;
    rpc_path: string;
    rpc_method: string;
}

/**
 * An interface for custom_rpc rule call. Named params are defined in separate interface smartvotes_custom_rpc_call_parameters;
 */
export interface smartvotes_custom_rpc_call {
    jsonrpc: "2.0";
    method: string;
    params: smartvotes_custom_rpc_call_parameters;
    id: number;
}

/**
 * An interface for custom_rpc rule call named parameters.
 */
export interface smartvotes_custom_rpc_call_parameters {
    /**
     * Username of a voter.
     */
    voter: string;
    /**
     * An voteorder that was send or that potentially could be sent by voter.
     */
    voteorder: smartvotes_voteorder;
}
