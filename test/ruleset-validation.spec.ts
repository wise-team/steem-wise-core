import { expect } from "chai";
import "mocha";

import { RulesValidator } from "../src/validation/RulesValidator";

describe("test/ruleset-validation.spec.ts", () => {
    describe("RulesValidator.validateVoteOrder [delegator=steemprojects1, voter=guest123]", () => {
        // TODO fails on empty voteorder, delegator, ruleset_name, author, permlink, type (empty or wrong), <=weight, >10000 weight
        // TODO fails on nonexistent ruleset
        // TODO fails on different voter in ruleset
        // TODO allows correct voter
        // TODO fails on wrong vote mode
        // TODO allows correct mode [upvote,flag,upvote+flag]
        // TODO fails on too high weight
        // TODO rule-authors[allow] pass on correct author
        // TODO rule-authors[allow] fails on incorrect author
        // TODO rule-authors[deny] pass on correct author
        // TODO rule-authors[deny] fails on incorrect author
        // TODO rule-tags[allow] pass on correct tag
        // TODO rule-tags[allow] fails on incorrect tag
        // TODO rule-tags[deny] pass on correct tag
        // TODO rule-tags[deny] fails on incorrect tag
        // TODO add TODO for custom RPC test
    });
});
