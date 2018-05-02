/**
 * These are rulesets used for rule validation unit tests. They are uploaded to @steemprojects1
 * steem account and delegates votes to @guest123. To send them use the following command (from project root dir):
 * $ node /tools/upload-steemprojects1-rulesets.js
 */
const rulesets = [];

rulesets.push({
    name: "upvoteAllowTagSteemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "allow",
            tags: ["steemprojects"]
        }
    ]
});

rulesets.push({
    name: "flagAllowTagSteemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "flag",
    rules: [
        {
            type: "tags",
            mode: "allow",
            tags: ["steemprojects"]
        }
    ]
});

rulesets.push({
    name: "upvoteFlagAllowTagSteemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote+flag",
    rules: [
        {
            type: "tags",
            mode: "allow",
            tags: ["steemprojects"]
        }
    ]
});

rulesets.push({
    name: "upvoteDenyTagSteemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "deny",
            tags: ["steemprojects"]
        }
    ]
});

rulesets.push({
    name: "upvoteAllowAuthorNoisy",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "allow",
            authors: ["noisy"]
        }
    ]
});

rulesets.push({
    name: "upvoteDenyAuthorNoisy",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "deny",
            authors: ["noisy"]
        }
    ]
});

rulesets.push({
    name: "upvoteNoRulesMaxWeight10",
    voter: "guest123",
    total_weight: 10,
    action: "upvote",
    rules: []
});

module.exports = rulesets;
