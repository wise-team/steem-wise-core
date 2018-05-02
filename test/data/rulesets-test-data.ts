import { smartvotes_ruleset } from "../../src/schema/smartvotes.schema";

const ruleset1: smartvotes_ruleset = {
    name: "Curator of tag #smartvotes",
    voter: "steemprojects1",
    total_weight: 20000,
    action: "upvote+flag",
    rules: [
        {
            type: "tags",
            mode: "allow",
            tags: ["smartvotes"]
        }
    ]
};

const ruleset2: smartvotes_ruleset = {
    name: "Punish bad content by @nonexistentuser1 and @nonexistentuser2 on tags #tag1 and #tag2.",
    voter: "steemprojects1",
    total_weight: 20000,
    action: "flag",
    rules: [
        {
            type: "tags",
            mode: "allow",
            tags: ["tag1", "tag2"]
        },
        {
            type: "authors",
            mode: "allow",
            authors: ["nonexistentuser1", "nonexistentuser2"]
        }
    ]
};

export const testRulesets = [ruleset1, ruleset2];