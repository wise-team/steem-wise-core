/* tslint:disable class-name */

import { Rule } from "../../../rules/Rule";
import { WeightRule } from "../../../rules/WeightRule";
import { TagsRule } from "../../../rules/TagsRule";
import { AuthorsRule } from "../../../rules/AuthorsRule";
import { CustomRPCRule } from "../../../rules/CustomRPCRule";
import { VotingPowerRule } from "../../../rules/VotingPowerRule";
import { wise_rule_weight, wise_rule_weight_decode, wise_rule_weight_encode } from "./rules/rule-weight-schema";

export type wise_rule = wise_rule_weight
                      | wise_rule_tags
                      | wise_rule_authors
                      | wise_rule_voting_power
                      | wise_rule_custom_rpc;



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


/**
 * This rule checks vorting_power of the delegator. Available modes are: more_than, less_than and egual.
 */
export interface wise_rule_voting_power {
    rule: "voting_power";
    mode: wise_rule_voting_power_mode;

    /**
     * Voting power of the delegator in steem_percent. 100% = 10'000 and 0% = 0. Percentage is multiplied by 100.
     */
    value: number;
}
export type wise_rule_voting_power_mode = "more_than" | "less_than" | "equal";


export interface wise_rule_custom_rpc {
    rule: "custom_rpc";
    host: string;
    port: number;
    path: string;
    method: string;
}


export const wise_rule_decode = (r: wise_rule): Rule | undefined => {
    if (r.rule === "weight") {
        return wise_rule_weight_decode(r as wise_rule_weight);
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
    else if (r.rule === "voting_power") {
        let mode: VotingPowerRule.Mode;
        if (r.mode === "more_than") mode = VotingPowerRule.Mode.MORE_THAN;
        else if (r.mode === "less_than") mode = VotingPowerRule.Mode.LESS_THAN;
        else if (r.mode === "equal") mode = VotingPowerRule.Mode.EQUAL;
        else return undefined;

        return new VotingPowerRule(mode, r.value);
    }
    else if (r.rule === "custom_rpc") {
        return new CustomRPCRule(r.host, r.port, r.path, r.method);
    }
    else return undefined;
};

export const wise_rule_encode = (r: Rule): wise_rule => {
    if (r.type() === Rule.Type.Weight) {
        return wise_rule_weight_encode(r as WeightRule);
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
    else if (r.type() === Rule.Type.VotingPower) {
        let mode: wise_rule_voting_power_mode;
        if ((r as VotingPowerRule).mode === VotingPowerRule.Mode.MORE_THAN) mode = "more_than";
        else if ((r as VotingPowerRule).mode === VotingPowerRule.Mode.LESS_THAN) mode = "less_than";
        else if ((r as VotingPowerRule).mode === VotingPowerRule.Mode.EQUAL) mode = "equal";
        else throw new Error("Unknown mode of voting power rule");

        const out: wise_rule_voting_power = {
            rule: "voting_power",
            mode: mode,
            value: (r as VotingPowerRule).value
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
