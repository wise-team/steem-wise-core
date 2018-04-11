import { smartvotes_vote_weight } from "./votes.schema";
export interface smartvotes_ruleset {
    voter: string;
    total_weight: smartvotes_vote_weight;
    rules: smartvotes_rule[];
}
export declare type smartvotes_rule = smartvotes_rule_tags | smartvotes_rule_authors | smartvotes_rule_time_window;
export interface smartvotes_rule_tags {
    type: "tags";
    mode: "allow" | "deny";
    tags: string[];
}
export interface smartvotes_rule_authors {
    type: "authors";
    mode: "allow" | "deny";
    authors: string[];
}
export interface smartvotes_rule_time_window {
    type: "time_window";
    older_than: number;
    younger_than: number;
}
