import { smartvotes_ruleset } from "../../src/steem-smartvotes";
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";

/**
 * These are rulesets used for synchronization unit tests. They are uploaded to @steemprojects2
 * steem account and delegate votes to @steemprojects1. To send them use the following command (from project root dir):
 * $ node /tools/upload-steemprojects2-rulesets.js ../path/to/steemprojects2.credentials.json.
 * It was already done by authors of the project, so it it unlikely that you have to do it. You should
 * be able to just run the tests which uses these rulesets (they were already uploaded to steem blockchain).
 */

export const rulesetsStage1: smartvotes_ruleset [] = [
    {
        name: "RulesetOneChangesContent",
        voter: "steemprojects1",
        total_weight: 1,
        action: "upvote",
        rules: [
            {
                type: "tags",
                mode: "require",
                tags: ["steemprojects"]
            },
            {
                type: "authors",
                mode: "allow",
                authors: ["noisy"]
            }
        ]
    },
    {
        name: "RulesetTwoWillBeRemoved",
        voter: "steemprojects1",
        total_weight: 1,
        action: "upvote",
        rules: [
            {
                type: "authors",
                mode: "allow",
                authors: ["perduta"]
            }
        ]
    }
];

// TODO voteorders go here

// TODO votes and confirmations go here

// TODO should not be included in lookup

const momentOfStage1Testing: SteemOperationNumber = new SteemOperationNumber(2, 2, 2 /* TODO */);

export const rulesetsStage2: smartvotes_ruleset [] = [
    {
        name: "RulesetOneChangesContent",
        voter: "steemprojects1",
        total_weight: 1,
        action: "upvote",
        rules: [
            {
                type: "tags",
                mode: "require",
                tags: ["steemprojects"]
            },
            {
                type: "authors",
                mode: "deny",
                authors: ["noisy"]
            }
        ]
    },
];

// TODO same voteorders go here (should be invalid)

// TODO new valid voteorders go here

// TODO no votes or confirmations

const momentOfStage2Testing: SteemOperationNumber = new SteemOperationNumber(2, 2, 2 /* TODO */);

export const rulesetsStage3: smartvotes_ruleset [] = [
    // disallow voting
];

// TODO same voteorders

// TODO no votes or confirmations

const momentOfStage3Testing: SteemOperationNumber = new SteemOperationNumber(2, 2, 2 /* TODO */);
