/*
 * These are the interfaces for smartvotes custom_json commands formatting.
 * Such formatted commands are then sent or received to/from steem blockchain.
 * NOTICE: Smartvotes interfaces are under early development. They may change over time.
 */

/////////////
// GENERAL //
/////////////

export interface smartvotes_transaction {
    type: "smartvote",
    command: smartvotes_command;
}

export type smartvotes_command = smartvotes_command_set_rules | smartvotes_command_send_votes;





///////////////
// SET_RULES //
///////////////

export interface smartvotes_command_set_rules {
   name: "set_rules";
   rules: smartvotes_rule_list;
}

export interface smartvotes_rule {
    type: string;
    voter: string;
    total_weight: number;
}

export interface smartvotes_rule_list {
    [index: number]: smartvotes_rule
}




////////////////
// SEND_VOTES //
////////////////

export interface smartvotes_command_send_votes {
    name: "send_votes";
    votes: smartvotes_vote_list;
}

export interface smartvotes_vote {
    slug: string,
    delegator: string,
    votingpower: number,
    type: smartvotes_vote_type
}

export interface smartvotes_vote_list {
    [index: number]: smartvotes_vote;
}

export enum smartvotes_vote_type {
    vote = "vote",
    flag = "flag"
}