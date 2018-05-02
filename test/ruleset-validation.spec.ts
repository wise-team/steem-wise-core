import { expect } from "chai";
import "mocha";

import { RulesValidator } from "../src/validation/RulesValidator";
import { smartvotes_voteorder } from "../src/schema/votes.schema";
import * as steemprojects1Rulesets from "./data/steemprojects1-rulesets";

const voter = "guest123";
const delegator = "steemprojects1";
const validVoteorder: smartvotes_voteorder = {
    ruleset_name: <string> steemprojects1Rulesets.upvoteAllowAuthorNoisy.name,
    author: "noisy",
    permlink: "i-ve-bought-4300-stickers-for-steemians-stickers-of-steem-steemit-dtube-dsound-strimi-and-utopian",
    delegator: "steemprojects1",
    weight: 1,
    type: "upvote"
};

describe("test/ruleset-validation.spec.ts", () => {
    describe("RulesValidator.validateVoteOrder [delegator=steemprojects1, voter=guest123]", () => {
        it("passes valid voteorder", function(done) {
            this.timeout(10000);

            const voteorder = validVoteorder;
            RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error) done(error);
                else if (!result) done(new Error("Unexpected behavior: validation failed, but no error returned."));
                else done();
            });
        });

        it("fails on empty voteorder", function(done) {
            this.timeout(100);
            const voteorder = undefined;
            RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error && !result) done();
                else done(new Error("should fail on empty voteorder"));
            });
        });

        ["delegator", "ruleset_name", "author", "permlink", "type"].forEach(function(prop) {
            it("fails on empty " + prop, function(done) {
                this.timeout(500);
                const propChanger: object = {};
                propChanger[prop] = "";
                const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, propChanger);
                RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                    if (error && !result) done();
                    else done(new Error("should fail on empty " + prop));
                });
            });
        });

        it("fails on invalid type", function(done) {
            this.timeout(100);
            const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { type: "not-upvote-not-flag" });
            RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error && !result) done();
                else done(new Error("should fail on invalid type"));
            });
        });

        [-1, 0, undefined, NaN, 10001, Infinity].forEach(function(weight) {
            it("fails on invald weight (" + weight + ")", function(done) {
                this.timeout(100);
                const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { weight: weight });
                RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                    if (error && !result) done();
                    else done(new Error("should fail on invald weight (" + weight + ")"));
                });
            });
        });

        it("fails on nonexistent ruleset", function(done) {
            this.timeout(5000);
            this.retries(1);
            const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { ruleset_name: "NonExistent" + Date.now() });
            RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error && !result) done();
                else done(new Error("should fail on nonexistent ruleset"));
            });
        });

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
