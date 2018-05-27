import { Rule } from "../../../rules/Rule";
import { WeightRule } from "../../../rules/WeightRule";
import { TagsRule } from "../../../rules/TagsRule";
import { AuthorsRule } from "../../../rules/AuthorsRule";
import { CustomRPCRule } from "../../../rules/CustomRPCRule";


/* tslint:disable class-name */

export type wise_rule = wise_rule_weight | wise_rule_tags | wise_rule_authors | wise_rule_custom_rpc;

export interface wise_rule_weight {
    rule: "weight";
    mode: wise_rule_weight_mode;

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
export type wise_rule_weight_mode = "single_vote_weight" | "votes_per_day";


export interface wise_rule_authors {
    rule: "authors";
    mode: wise_rule_authors_mode;
    authors: string [];
}
export type wise_rule_authors_mode = "allow" | "deny";


export interface wise_rule_tags {
    rule: "tags";
    mode: wise_rule_tags_mode;
    tags: string [];
}
export type wise_rule_tags_mode = "allow" | "deny" | "any" | "require";


export interface wise_rule_custom_rpc {
    rule: "custom_rpc";
    host: string;
    port: number;
    path: string;
    method: string;
}


export const wise_rule_decode = (r: wise_rule): Rule | undefined => {
    if (r.rule === "weight") {
        let mode: WeightRule.Mode;
        if (r.mode === "single_vote_weight") mode = WeightRule.Mode.SINGLE_VOTE_WEIGHT;
        else if (r.mode === "votes_per_day") mode = WeightRule.Mode.VOTES_PER_DAY;
        else return undefined;

        return new WeightRule(mode, r.min, r.max);
    }
    else if (r.rule === "tags") {
        let mode: TagsRule.Mode;
        if (r.mode === "allow") mode = TagsRule.Mode.ALLOW;
        else if (r.mode === "deny") mode = TagsRule.Mode.DENY;
        else if (r.mode === "require") mode = TagsRule.Mode.REQUIRE;
        else if (r.mode === "any") mode = TagsRule.Mode.ANY;
        else return undefined;

        return new TagsRule(mode, r.tags);
    }
    else if (r.rule === "authors") {
        let mode: AuthorsRule.Mode;
        if (r.mode === "allow") mode = AuthorsRule.Mode.ALLOW;
        else if (r.mode === "deny") mode = AuthorsRule.Mode.DENY;
        else return undefined;

        return new AuthorsRule(mode, r.authors);
    }
    else if (r.rule === "custom_rpc") {
        return new CustomRPCRule(r.host, r.port, r.path, r.method);
    }
    else return undefined;
};

export const wise_rule_encode = (r: Rule): wise_rule => {
    if (r.type() === Rule.Type.Weight) {
        let mode: wise_rule_weight_mode;
        if ((r as WeightRule).mode === WeightRule.Mode.SINGLE_VOTE_WEIGHT) mode = "single_vote_weight";
        else if ((r as WeightRule).mode === WeightRule.Mode.VOTES_PER_DAY) mode = "votes_per_day";
        else throw new Error("Unknown mode of weight rule");

        const out: wise_rule_weight = {
            rule: "weight",
            mode: mode,
            min: (r as WeightRule).min,
            max: (r as WeightRule).max
        };
        return out;
    }
    else if (r.type() === Rule.Type.Authors) {
        let mode: wise_rule_authors_mode;
        if ((r as AuthorsRule).mode === AuthorsRule.Mode.ALLOW) mode = "allow";
        else if ((r as AuthorsRule).mode === AuthorsRule.Mode.DENY) mode = "deny";
        else throw new Error("Unknown mode of authors rule");

        const out: wise_rule_authors = {
            rule: "authors",
            mode: mode,
            authors: (r as AuthorsRule).authors
        };
        return out;
    }
    else if (r.type() === Rule.Type.Tags) {
        let mode: wise_rule_tags_mode;
        if ((r as TagsRule).mode === TagsRule.Mode.ALLOW) mode = "allow";
        else if ((r as TagsRule).mode === TagsRule.Mode.DENY) mode = "deny";
        else if ((r as TagsRule).mode === TagsRule.Mode.ANY) mode = "any";
        else if ((r as TagsRule).mode === TagsRule.Mode.REQUIRE) mode = "require";
        else throw new Error("Unknown mode of tags rule");

        const out: wise_rule_tags = {
            rule: "tags",
            mode: mode,
            tags: (r as TagsRule).tags
        };
        return out;
    }
    else if (r.type() === Rule.Type.CustomRPC) {
        const out: wise_rule_custom_rpc = {
            rule: "custom_rpc",
            host: (r as CustomRPCRule).host,
            port: (r as CustomRPCRule).port,
            path: (r as CustomRPCRule).path,
            method: (r as CustomRPCRule).method,
        };
        return out;
    }
    else throw new Error("Unknown rule type");
};
