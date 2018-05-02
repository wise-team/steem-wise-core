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
    permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
    delegator: "steemprojects1",
    weight: 1,
    type: "upvote"
};

describe("test/ruleset-validation.spec.ts", function() {
    describe("RulesValidator.validateVoteOrder [delegator=steemprojects1, voter=guest123]", function() {
        this.retries(1);

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
                else done(new Error("Should fail on empty voteorder"));
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
                    else done(new Error("Should fail on empty " + prop));
                });
            });
        });

        it("fails on invalid type", function(done) {
            this.timeout(100);
            const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { type: "not-upvote-not-flag" });
            RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error && !result) done();
                else done(new Error("Should fail on invalid type"));
            });
        });

        [-1, 0, undefined, NaN, 3, 10000, Infinity].forEach(function(weight) {
            it("fails on invald weight (" + weight + ")", function(done) {
                this.timeout(10000);
                const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { ruleset_name: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: weight });
                RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                    if (error && !result) done();
                    else done(new Error("Should fail on invald weight (" + weight + ")"));
                });
            });
        });

        it("allows valid weight (2)", function(done) {
            this.timeout(10000);
            const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { ruleset_name: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: 2 });
            RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error || result) done(error);
                else done();
            });
        });

        it("fails on nonexistent ruleset", function(done) {
            this.timeout(10000);
            const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { ruleset_name: "NonExistent" + Date.now() });
            RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error && !result) done();
                else done(new Error("Should fail on nonexistent ruleset"));
            });
        });

        it("fails on different voter", function(done) {
            this.timeout(10000);
            const voteorder: smartvotes_voteorder = validVoteorder;
            RulesValidator.validateVoteOrder("NonExistent-voter-" + Date.now(), voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                if (error && !result) done();
                else done(new Error("Should fail on different voter"));
            });
        });

        [
            {ruleset: steemprojects1Rulesets.upvoteRequireTagSteemprojects, type: "flag", pass: false}, // fail
            {ruleset: steemprojects1Rulesets.upvoteRequireTagSteemprojects, type: "upvote", pass: true}, // pass
            {ruleset: steemprojects1Rulesets.flagRequireTagSteemprojects, type: "flag", pass: true}, // pass
            {ruleset: steemprojects1Rulesets.flagRequireTagSteemprojects, type: "upvote", pass: false}, // fail
            {ruleset: steemprojects1Rulesets.upvoteAndFlagRequireTagSteemprojects, type: "flag", pass: true}, // pass
            {ruleset: steemprojects1Rulesets.upvoteAndFlagRequireTagSteemprojects, type: "upvote", pass: true} // pass
        ].forEach(function(voteorderCase) {
            it((voteorderCase.pass ? "passes on allowed" : "fails on disallowed") + " vote type [ruleset=\"" + voteorderCase.ruleset.name + "\", allowed=" + voteorderCase.ruleset.action + ", tested=" + voteorderCase.type + "]", function(done) {
                this.timeout(10000);
                const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { ruleset_name: voteorderCase.ruleset.name, type: voteorderCase.type });
                RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                    if (voteorderCase.pass) {
                        if (error || !result) done(error);
                        else done();
                    }
                    else {
                        if (error && !result) done();
                        else done(new Error("Should fail on disallowed vote mode"));
                    }
                });
            });
        });

        [
            {ruleset: steemprojects1Rulesets.upvoteAllowAuthorNoisy, author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: true}, // pass
            {ruleset: steemprojects1Rulesets.upvoteAllowAuthorNoisy, author: "perduta",
                permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: false}, // fail
            {ruleset: steemprojects1Rulesets.upvoteDenyAuthorNoisy, author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: false}, // fail
            {ruleset: steemprojects1Rulesets.upvoteDenyAuthorNoisy, author: "perduta",
                permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: true}, // pass
            {ruleset: steemprojects1Rulesets.upvoteAllowAuthorsNoisyAndPerduta, author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: true}, // pass
            {ruleset: steemprojects1Rulesets.upvoteAllowAuthorsNoisyAndPerduta, author: "perduta",
                permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: true} // pass
        ].forEach(function(voteorderCase) {
            it((voteorderCase.pass ? "passes on allowed" : "fails on disallowed") + " author [ruleset=\"" + voteorderCase.ruleset.name + "\", allowed=" + voteorderCase.ruleset.rules[0].authors.join() + ", tested=" + voteorderCase.author + "]", function(done) {
                this.timeout(10000);
                const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { ruleset_name: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });
                RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                    if (voteorderCase.pass) {
                        if (error || !result) done(error);
                        else done();
                    }
                    else {
                        if (error && !result) done();
                        else done(new Error("Should fail on disallowed author"));
                    }
                });
            });
        });

        [
            {ruleset: steemprojects1Rulesets.upvoteAllowTags, author: "cryptoctopus",
                permlink: "steemprojects-com-a-project-we-should-all-care-about-suggestions",
                pass: true}, // has all tags from allow list => pass
            {ruleset: steemprojects1Rulesets.upvoteAllowTags, author: "nmax83",
                permlink: "steemprojects-com-sebuah-proyek-yang-seharusnya-kita-semua-peduli-tentang-saran-e78b56ef99562",
                pass: false}, // only one of the post tags in not on the list => fail
            {ruleset: steemprojects1Rulesets.upvoteDenyTagSteemprojects, author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: false}, // has on tag from the list => fail
            {ruleset: steemprojects1Rulesets.upvoteDenyTagSteemprojects, author: "perduta",
                permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: true}, // has no tags from the list => pass
            {ruleset: steemprojects1Rulesets.upvoteRequireTagSteemprojectsAndReview, author: "perduta",
                permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: false}, // it does not have any of the required tags => fail
            {ruleset: steemprojects1Rulesets.upvoteRequireTagSteemprojectsAndReview, author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: false}, // it has only one of the required tags => fail
            {ruleset: steemprojects1Rulesets.upvoteRequireTagSteemprojectsAndReview, author: "phgnomo",
                permlink: "steem-project-of-the-week-1-get-on-steem",
                pass: true}, // it has both of the required tags => pass
            {ruleset: steemprojects1Rulesets.upvoteAnyOfTags, author: "phgnomo",
                permlink: "steem-project-of-the-week-1-get-on-steem",
                pass: true}, // it has both of the required tags => pass
            {ruleset: steemprojects1Rulesets.upvoteAnyOfTags, author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: true}, // it has only one of the required tags => pass
            {ruleset: steemprojects1Rulesets.upvoteAnyOfTags, author: "tanata",
                permlink: "man-of-steel",
                pass: true}, // it has only one of the required tags => pass
            {ruleset: steemprojects1Rulesets.upvoteAnyOfTags, author: "perduta",
                permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: false} // it has no one of the required tags => fail
        ].forEach(function(voteorderCase) {
            it((voteorderCase.pass ? "passes on allowed" : "fails on disallowed") + " tags [ruleset=\"" + voteorderCase.ruleset.name + "\","
            + " mode=" + voteorderCase.ruleset.rules[0].mode + ", tags=" + voteorderCase.ruleset.rules[0].tags.join() + ","
            + " post=@" + voteorderCase.author + "/" + voteorderCase.permlink + "]", function(done) {
                this.timeout(10000);
                const voteorder: smartvotes_voteorder = Object.assign({}, validVoteorder, { ruleset_name: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });
                RulesValidator.validateVoteOrder(voter, voteorder, new Date(), function(error: Error | undefined, result: boolean) {
                    if (voteorderCase.pass) {
                        if (error || !result) done(error);
                        else done();
                    }
                    else {
                        if (error && !result) done();
                        else done(new Error("Should fail on disallowed tag"));
                    }
                });
            });
        });

        // TODO test rule joining
        // TODO test non existing post

        // TODO unit test custom_rpc
        // TODO unit test total_weight
    });
});
