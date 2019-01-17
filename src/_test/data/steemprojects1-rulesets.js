/**
 * THIS IS JAVASCRIPT VERSION of steemprojects1-rulesets.ts
 */
/**
 * These are rulesets used for rule validation unit tests. They are uploaded to @steemprojects1
 * steem account and delegates votes to @guest123. To send them use the following command (from project root dir):
 * $ node /tools/upload-steemprojects1-rulesets.js ../path/to/steemprojects1.credentials.json.
 * It was already done by authors of the project, so it it unlikely that you have to do it. You should
 * be able to just run the tests which uses these rulesets (they were already uploaded to steem blockchain).
 */
const rulesets = [];

const upvoteRequireTagSteemprojects = {
    name: "Upvote, require tag #steemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"]
        }
    ]
};
rulesets.push(upvoteRequireTagSteemprojects);
module.exports.upvoteRequireTagSteemprojects = upvoteRequireTagSteemprojects;



const flagRequireTagSteemprojects = {
    name: "Flag, require tag #steemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "flag",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"]
        }
    ]
};
rulesets.push(flagRequireTagSteemprojects);
module.exports.flagRequireTagSteemprojects = flagRequireTagSteemprojects;



const upvoteAndFlagRequireTagSteemprojects = {
    name: "Upvote and flag, require tag #steemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote+flag",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"]
        }
    ]
};
rulesets.push(upvoteAndFlagRequireTagSteemprojects);
module.exports.upvoteAndFlagRequireTagSteemprojects = upvoteAndFlagRequireTagSteemprojects;



// this is for validation of https://steemit.com/steemprojects/@cryptoctopus/steemprojects-com-a-project-we-should-all-care-about-suggestions
const upvoteAllowTags = {
    name: "Upvote, allow tags #steemprojects, #steemdev, #suggestion, #input, #busy, #esteem, #nonexistenttag",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "allow",
            tags: ["steemprojects", "steemdev", "suggestion", "input", "busy", "esteem", "nonexistenttag"]
        }
    ]
};
rulesets.push(upvoteAllowTags);
module.exports.upvoteAllowTags = upvoteAllowTags;



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


const upvoteRequireTagSteemprojectsAndReview = {
    name: "Upvote, require tags #steemprojects and #review",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects", "review"]
        }
    ]
};
rulesets.push(upvoteRequireTagSteemprojectsAndReview);
module.exports.upvoteRequireTagSteemprojectsAndReview = upvoteRequireTagSteemprojectsAndReview;


const upvoteAnyOfTags = {
    name: "Upvote, any of the tags: #steemprojects, #review",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "any",
            tags: ["steemprojects", "review"]
        }
    ]
};
rulesets.push(upvoteAnyOfTags);
module.exports.upvoteAnyOfTags = upvoteAnyOfTags;



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



const upvoteAllowAuthorsNoisyAndPerduta = {
    name: "Upvote, allow authors @noisy and @perduta",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "allow",
            authors: ["noisy", "perduta"]
        }
    ]
};
rulesets.push(upvoteAllowAuthorsNoisyAndPerduta);
module.exports.upvoteAllowAuthorsNoisyAndPerduta = upvoteAllowAuthorsNoisyAndPerduta;



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



const upvoteTwoRulesJoined = {
    name: "Upvote, two rules joined",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "allow",
            authors: ["noisy"]
        },
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"]
        }
    ]
};
rulesets.push(upvoteTwoRulesJoined);
module.exports.upvoteTwoRulesJoined = upvoteTwoRulesJoined;



module.exports.rulesets = rulesets;