import { SendVoteorder, SetRules, WeightRule, TagsRule } from "../../src/wise";

export const sendRules_valid = {
    voter: "guest123",
    delegator: "guest123",
    rules: {
        rulesets: [
            {
                name: "test_purpose_ruleset",
                rules: [
                    new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 1000),
                    new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects"])
                ]
            }
        ]
    } as SetRules
};

export const sendVoteorder_valid = {
    voter: "guest123",
    delegator: "guest123",
    voteorder: {
        rulesetName: "test_purpose_ruleset",
        permlink: "hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem",
        author: "urbangladiator",
        weight: 1000
    } as SendVoteorder
};

export const sendVoteorder_invalid = {
    voter: "guest123",
    delegator: "guest123",
    voteorder: {
        rulesetName: "test_purpose_ruleset",
        permlink: "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that",
        author: "noisy",
        weight: 1000
    } as SendVoteorder
};
