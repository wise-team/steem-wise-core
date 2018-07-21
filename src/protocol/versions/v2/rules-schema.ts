/* tslint:disable class-name */

import { Rule } from "../../../rules/Rule";
import { WeightRule } from "../../../rules/WeightRule";
import { TagsRule } from "../../../rules/TagsRule";
import { AuthorsRule } from "../../../rules/AuthorsRule";
import { CustomRPCRule } from "../../../rules/CustomRPCRule";
import { VotingPowerRule } from "../../../rules/VotingPowerRule";
import { wise_rule_weight, wise_rule_weight_decode, wise_rule_weight_encode } from "./rules/rule-weight-schema";
import { wise_rule_tags, wise_rule_tags_decode, wise_rule_tags_encode } from "./rules/rule-tags-schema";
import {  wise_rule_authors, wise_rule_authors_encode, wise_rule_authors_decode } from "./rules/rule-authors-schema";
import { wise_rule_voting_power, wise_rule_voting_power_decode, wise_rule_voting_power_encode } from "./rules/rule-voting-power-schema";
import { wise_rule_custom_rpc, wise_rule_custom_rpc_decode, wise_rule_custom_rpc_encode } from "./rules/rule-custom-rpc-schema";
import { ValidationException } from "../../../validation/ValidationException";
import { wise_rule_weight_for_period, wise_rule_weight_for_period_decode, wise_rule_weight_for_period_encode } from "./rules/rule-weight-for-period-schema";
import { WeightForPeriodRule } from "../../../rules/WeightForPeriodRule";

export type wise_rule = wise_rule_weight
                      | wise_rule_tags
                      | wise_rule_authors
                      | wise_rule_voting_power
                      | wise_rule_custom_rpc
                      | wise_rule_weight_for_period;

export const wise_rule_decode = (r: wise_rule): Rule | undefined => {
    switch (r.rule) {
        case "weight":
            return wise_rule_weight_decode(r as wise_rule_weight);

        case "weight_for_period":
            return wise_rule_weight_for_period_decode(r as wise_rule_weight_for_period);

        case "tags":
            return wise_rule_tags_decode(r as wise_rule_tags);

        case "authors":
            return wise_rule_authors_decode(r as wise_rule_authors);

        case "voting_power":
            return wise_rule_voting_power_decode(r as wise_rule_voting_power);

        case "custom_rpc":
            return wise_rule_custom_rpc_decode(r as wise_rule_custom_rpc);

        default:
            throw new ValidationException("v2 unknown rule: '" + (r as any).rule + "'");
    }
};

export const wise_rule_encode = (r: Rule): wise_rule => {
    switch (r.type()) {
        case Rule.Type.Weight:
            return wise_rule_weight_encode(r as WeightRule);

        case Rule.Type.WeightForPeriod:
            return wise_rule_weight_for_period_encode(r as WeightForPeriodRule);

        case Rule.Type.Tags:
            return wise_rule_tags_encode(r as TagsRule);

        case Rule.Type.Authors:
            return wise_rule_authors_encode(r as AuthorsRule);

        case Rule.Type.VotingPower:
            return wise_rule_voting_power_encode(r as VotingPowerRule);

        case Rule.Type.CustomRPC:
            return wise_rule_custom_rpc_encode(r as CustomRPCRule);

        default:
            throw new ValidationException("Rule type " + r.type() + " is not supported by V2 protocol handler.");
    }
};
