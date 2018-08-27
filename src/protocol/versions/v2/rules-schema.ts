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
import { wise_rule_votes_count_encode, wise_rule_votes_count_decode, wise_rule_votes_count } from "./rules/rule-votes-count-schema";
import { wise_rule_voters_encode, wise_rule_voters_decode, wise_rule_voters } from "./rules/rule-voters-schema";
import { wise_rule_first_post_encode, wise_rule_first_post_decode, wise_rule_first_post } from "./rules/rule-first-post-schema";
import { wise_rule_payout_encode, wise_rule_payout_decode, wise_rule_payout } from "./rules/rule-payout-schema";
import { wise_rule_expiration_date, wise_rule_expiration_date_decode, wise_rule_expiration_date_encode } from "./rules/rule-expiration-date";
import { wise_rule_age_of_post_encode, wise_rule_age_of_post_decode, wise_rule_age_of_post } from "./rules/rule-age-of-post-schema";
import { VotesCountRule } from "../../../rules/VotesCountRule";
import { VotersRule } from "../../../rules/VotersRule";
import { FirstPostRule } from "../../../rules/FirstPostRule";
import { PayoutRule } from "../../../rules/PayoutRule";
import { AgeOfPostRule } from "../../../rules/AgeOfPostRule";
import { ExpirationDateRule } from "../../../rules/ExpirationDateRule";

export type wise_rule = wise_rule_weight
                      | wise_rule_tags
                      | wise_rule_authors
                      | wise_rule_voting_power
                      | wise_rule_custom_rpc
                      | wise_rule_weight_for_period
                      | wise_rule_votes_count
                      | wise_rule_voters
                      | wise_rule_first_post
                      | wise_rule_payout
                      | wise_rule_age_of_post
                      | wise_rule_expiration_date
         // TODO:     | different_rule -> user should see a warning, and validation should fail: https://github.com/noisy-witness/steem-wise-core/issues/24
                      ;

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

        case "votes_count":
            return wise_rule_votes_count_decode(r as wise_rule_votes_count);

        case "voters":
            return wise_rule_voters_decode(r as wise_rule_voters);

        case "first_post":
            return wise_rule_first_post_decode(r as wise_rule_first_post);

        case "payout":
            return wise_rule_payout_decode(r as wise_rule_payout);

        case "age_of_post":
            return wise_rule_age_of_post_decode(r as wise_rule_age_of_post);

        case "expiration_date":
            return wise_rule_expiration_date_decode(r as wise_rule_expiration_date);

        default:
            // TODO: different_rule -> user should see a warning, and validation should fail: https://github.com/noisy-witness/steem-wise-core/issues/24
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

        case Rule.Type.VotesCount:
            return wise_rule_votes_count_encode(r as VotesCountRule);

        case Rule.Type.Voters:
            return wise_rule_voters_encode(r as VotersRule);

        case Rule.Type.FirstPost:
            return wise_rule_first_post_encode(r as FirstPostRule);

        case Rule.Type.Payout:
            return wise_rule_payout_encode(r as PayoutRule);

        case Rule.Type.AgeOfPost:
            return wise_rule_age_of_post_encode(r as AgeOfPostRule);

        case Rule.Type.ExpirationDate:
            return wise_rule_expiration_date_encode(r as ExpirationDateRule);

        default:
            // TODO: different_rule -> user should see a warning, and sending rules should fail: https://github.com/noisy-witness/steem-wise-core/issues/24
            throw new ValidationException("Rule type " + r.type() + " is not supported by V2 protocol handler.");
    }
};
