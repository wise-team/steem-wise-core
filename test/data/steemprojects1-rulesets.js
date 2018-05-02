/**
 * These are rulesets used for rule validation unit tests. They are uploaded to @steemprojects1
 * steem account and delegates votes to @guest123. To send them use the following command (from project root dir):
 * $ node /tools/upload-steemprojects1-rulesets.js ../path/to/steemprojects1.credentials.json.
 * It was already done by authors of the project, so it it unlikely that you have to do it. You should
 * be able to just run the tests which uses these rulesets (they were already uploaded to steem blockchain).
 */
const rulesets = [];

const upvoteAllowTagSteemprojects = {
    name: "Upvote, allow tag #steemprojects",
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
};
rulesets.push(upvoteAllowTagSteemprojects);
module.exports.upvoteAllowTagSteemprojects = upvoteAllowTagSteemprojects;


const flagAllowTagSteemprojects = {
    name: "Flag, allow tag #steemprojects",
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
};
rulesets.push(flagAllowTagSteemprojects);
module.exports.flagAllowTagSteemprojects = flagAllowTagSteemprojects;


const upvoteFlagAllowTagSteemprojects = {
    name: "Upvote and flag, allow tag #steemprojects",
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
};
rulesets.push(upvoteFlagAllowTagSteemprojects);
module.exports.upvoteFlagAllowTagSteemprojects = upvoteFlagAllowTagSteemprojects;


const upvoteDenyTagSteemprojects = {
    name: "Upvote, deny tag #steemprojects",
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
};
rulesets.push(upvoteDenyTagSteemprojects);
module.exports.upvoteDenyTagSteemprojects = upvoteDenyTagSteemprojects;


const upvoteAllowAuthorNoisy = {
    name: "Upvote, allow author @noisy",
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
};
rulesets.push(upvoteAllowAuthorNoisy);
module.exports.upvoteAllowAuthorNoisy = upvoteAllowAuthorNoisy;


const upvoteDenyAuthorNoisy = {
    name: "Upvote, deny author @noisy",
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
};
rulesets.push(upvoteDenyAuthorNoisy);
module.exports.upvoteDenyAuthorNoisy = upvoteDenyAuthorNoisy;


const upvoteNoRulesMaxWeight2 = {
    name: "Upvote, no rules, max total weight 2",
    voter: "guest123",
    total_weight: 2,
    action: "upvote",
    rules: []
};
rulesets.push(upvoteNoRulesMaxWeight2);
module.exports.upvoteNoRulesMaxWeight2 = upvoteNoRulesMaxWeight2;


module.exports.rulesets = rulesets;
