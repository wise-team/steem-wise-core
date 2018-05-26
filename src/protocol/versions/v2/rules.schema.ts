/* tslint:disable class-name */

export type wise_rule = wise_rule_weight | wise_rule_tags | wise_rule_authors | wise_rule_custom_rpc;

export interface wise_rule_weight {
    mode: "single_vote_weight" | "votes_per_day";

    /**
     * Minimal flag weight (-10000 = full flag, 0 = disable flag)
     *
     * @minimum -10000
     * @maximum 0
     * @TJS-type integer
     */
    min: number;

    /**
     * Maximal upvote weight (0 = disable upvote, 10000 = full upvote)
     *
     * @minimum 0
     * @maximum 10000
     * @TJS-type integer
     */
    max: number;
}

export interface wise_rule_authors {
    mode: "allow" | "deny";
    authors: string [];
}

export interface wise_rule_tags {
    mode: "allow" | "deny" | "any" | "require";
    tags: string [];
}

export interface wise_rule_custom_rpc {
    host: string;
    port: string;
    path: string;
    method: string;
}