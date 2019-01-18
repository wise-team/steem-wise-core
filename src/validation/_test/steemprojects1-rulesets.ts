import { smartvotes_ruleset } from "../../protocol/versions/v1/rules.schema";

/**
 * These are rulesets used for rule validation unit tests. They are uploaded to @steemprojects1
 * steem account and delegates votes to @guest123. To send them use the following command (from project root dir):
 * $ node /tools/upload-steemprojects1-rulesets.js ../path/to/steemprojects1.credentials.json.
 * It was already done by authors of the project, so it it unlikely that you have to do it. You should
 * be able to just run the tests which uses these rulesets (they were already uploaded to steem blockchain).
 */
export const rulesets: smartvotes_ruleset[] = [];

export const upvoteRequireTagSteemprojects: smartvotes_ruleset = {
    name: "Upvote, require tag #steemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"],
        },
    ],
};
rulesets.push(upvoteRequireTagSteemprojects);

export const flagRequireTagSteemprojects: smartvotes_ruleset = {
    name: "Flag, require tag #steemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "flag",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"],
        },
    ],
};
rulesets.push(flagRequireTagSteemprojects);

export const upvoteAndFlagRequireTagSteemprojects: smartvotes_ruleset = {
    name: "Upvote and flag, require tag #steemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote+flag",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"],
        },
    ],
};
rulesets.push(upvoteAndFlagRequireTagSteemprojects);

// this is for validation of https://steemit.com/steemprojects/@cryptoctopus/steemprojects-com-a-project-we-should-all-care-about-suggestions
export const upvoteAllowTags: smartvotes_ruleset = {
    name: "Upvote, allow tags #steemprojects, #steemdev, #suggestion, #input, #busy, #esteem, #nonexistenttag",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "allow",
            tags: ["steemprojects", "steemdev", "suggestion", "input", "busy", "esteem", "nonexistenttag"],
        },
    ],
};
rulesets.push(upvoteAllowTags);

export const upvoteDenyTagSteemprojects: smartvotes_ruleset = {
    name: "Upvote, deny tag #steemprojects",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "deny",
            tags: ["steemprojects"],
        },
    ],
};
rulesets.push(upvoteDenyTagSteemprojects);

export const upvoteRequireTagSteemprojectsAndReview: smartvotes_ruleset = {
    name: "Upvote, require tags #steemprojects and #review",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects", "review"],
        },
    ],
};
rulesets.push(upvoteRequireTagSteemprojectsAndReview);

export const upvoteAnyOfTags: smartvotes_ruleset = {
    name: "Upvote, any of the tags: #steemprojects, #review",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "tags",
            mode: "any",
            tags: ["steemprojects", "review"],
        },
    ],
};
rulesets.push(upvoteAnyOfTags);

export const upvoteAllowAuthorNoisy: smartvotes_ruleset = {
    name: "Upvote, allow author @noisy",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "allow",
            authors: ["noisy"],
        },
    ],
};
rulesets.push(upvoteAllowAuthorNoisy);

export const upvoteAllowAuthorsNoisyAndPerduta: smartvotes_ruleset = {
    name: "Upvote, allow authors @noisy and @perduta",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "allow",
            authors: ["noisy", "perduta"],
        },
    ],
};
rulesets.push(upvoteAllowAuthorsNoisyAndPerduta);

export const upvoteDenyAuthorNoisy: smartvotes_ruleset = {
    name: "Upvote, deny author @noisy",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "deny",
            authors: ["noisy"],
        },
    ],
};
rulesets.push(upvoteDenyAuthorNoisy);

export const upvoteNoRulesMaxWeight2: smartvotes_ruleset = {
    name: "Upvote, no rules, max total weight 2",
    voter: "guest123",
    total_weight: 2,
    action: "upvote",
    rules: [],
};
rulesets.push(upvoteNoRulesMaxWeight2);

export const upvoteTwoRulesJoined: smartvotes_ruleset = {
    name: "Upvote, two rules joined",
    voter: "guest123",
    total_weight: 1,
    action: "upvote",
    rules: [
        {
            type: "authors",
            mode: "allow",
            authors: ["noisy"],
        },
        {
            type: "tags",
            mode: "require",
            tags: ["steemprojects"],
        },
    ],
};
rulesets.push(upvoteTwoRulesJoined);
