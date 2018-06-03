import { expect } from "chai";
import "mocha";

import * as steem from "steem";
import * as fakeDataset_ from "./data/fake-blockchain.json";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

import * as steemprojects1Rulesets from "./data/steemprojects1-rulesets";
import { Util } from "../src/util/util";
import { smartvotes_voteorder } from "../src/protocol/versions/v1/votes.schema";
import { SteemOperationNumber, Wise, DirectBlockchainApi, SendVoteorder, ValidationException, AuthorsRule, TagsRule } from "../src/wise";
import { FakeApi } from "../src/api/FakeApi";

const voter = "guest123";
const delegator = "steemprojects1";
const validVoteorder: SendVoteorder = {
    rulesetName: <string> steemprojects1Rulesets.upvoteAllowAuthorNoisy.name,
    author: "noisy",
    permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
    weight: 1,
};

const rulesetMomentForValidation: SteemOperationNumber = new SteemOperationNumber(22144059, 32, 0).addTransactions(1); // Moment just after tx_id = 7fe4a1a4efadb1230c41c2c865df15d91eb3c452

describe("test/ruleset-validation.spec.ts", function() {
    describe("RulesValidator.validateVoteOrder [delegator=steemprojects1, voter=guest123]", function() {
        this.retries(1);

        const wise = new Wise(voter, FakeApi.fromDataset(fakeDataset));

        it("passes valid voteorder", function(done) {
            this.timeout(10000);

            const voteorder = validVoteorder;

            wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                if (error) done(error);
                else if (result !== true) done(result);
                else done();
            });
        });

        it("fails on empty voteorder", function(done) {
            this.timeout(100);
            const voteorder = JSON.parse("{}") as SendVoteorder;

            wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                if (error) done(error);
                else if (result === true) done(new Error("Should fail on empty voteorder"));
                else done();
            });
        });

        ["rulesetName", "author", "permlink", "weight"].forEach(function(prop: string) {
            it("fails on empty " + prop, function(done) {
                this.timeout(500);
                const propChanger: any = {};
                propChanger[prop] = "";
                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, propChanger);

                wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                    if (error) done(error);
                    else if (result === true) done(new Error("Should fail on empty property " + prop));
                    else done();
                });
            });
        });

        [-1, 0, undefined, NaN, 3, 10000, Infinity].forEach(function(weight) {
            it("fails on invald weight (" + weight + ")", function(done) {
                this.timeout(10000);
                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: weight });

                wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                    if (error) done(error);
                    else if (result === true) done(new Error("Should fail on invalid weight: " + weight));
                    else done();
                });
            });
        });


        it("allows valid weight (2)", function(done) {
            this.timeout(10000);
            const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: 2 });

            wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                if (error) done(error);
                else if (result === true) done();
                else done(result);
            });
        });

        it("fails on nonexistent ruleset", function(done) {
            this.timeout(10000);
            const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: "NonExistent" + Date.now() });

            wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                if (error) done(error);
                else if (result === true) done(new Error("Should fail on nonexistent ruleset"));
                else done();
            });
        });

        it("fails on different voter", function(done) {
            this.timeout(10000);
            const voteorder: SendVoteorder = validVoteorder;

            wise.validateVoteorder(delegator, "NonExistent-voter-" + Date.now(), voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                if (error) done(error);
                else if (result === true) done(new Error("Should fail on different voter"));
                else done();
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
            it((voteorderCase.pass ? "passes on allowed" : "fails on disallowed") + " author [ruleset=\"" + voteorderCase.ruleset.name + "\", allowed=" + (voteorderCase.ruleset.rules[0] as AuthorsRule).authors.join() + ", tested=" + voteorderCase.author + "]", function(done) {
                this.timeout(25000);
                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });

                wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                    if (voteorderCase.pass) {
                        if (error) done(error);
                        else if (result === true) done();
                        else done(result);
                    }
                    else {
                        if (error) done(error);
                        else if (result === true) done(new Error("Should fail on disallowed author"));
                        else done();
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
            + " mode=" + (voteorderCase.ruleset.rules[0] as TagsRule).mode + ", tags=" + (voteorderCase.ruleset.rules[0] as TagsRule).tags.join() + ","
            + " post=@" + voteorderCase.author + "/" + voteorderCase.permlink + "]", function(done) {
                this.timeout(20000);
                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });


                wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                    if (voteorderCase.pass) {
                        if (error) done(error);
                        else if (result === true) done();
                        else done(result);
                    }
                    else {
                        if (error) done(error);
                        else if (result === true) done(new Error("Should fail on disallowed tag"));
                        else done();
                    }
                });
            });
        });


        [
            {ruleset: steemprojects1Rulesets.upvoteTwoRulesJoined, author: "cryptoctopus",
                permlink: "steemprojects-com-a-project-we-should-all-care-about-suggestions",
                pass: false}, // has tag #steemprojects, but is not authored by @noisy => fail
            {ruleset: steemprojects1Rulesets.upvoteTwoRulesJoined, author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: true}, // has tag #steemprojects and is authored by @noisy => pass
                {ruleset: steemprojects1Rulesets.upvoteTwoRulesJoined, author: "noisy",
                permlink: "public-and-private-keys-how-to-generate-all-steem-user-s-keys-from-master-password-without-a-steemit-website-being-offline",
                pass: false} // is authored by @noisy, but does not have tag #steemprojects => fail
        ].forEach(function(voteorderCase) {
            it((voteorderCase.pass ? "passes when all rules fulfilled" : "fails when not all rules fulfilled") + " [ruleset=\"" + voteorderCase.ruleset.name + "\","
            + " post=@" + voteorderCase.author + "/" + voteorderCase.permlink + "]", function(done) {
                this.timeout(10000);
                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });
                wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                    if (voteorderCase.pass) {
                        if (error) done(error);
                        else if (result === true) done();
                        else done(result);
                    }
                    else {
                        if (error) done(error);
                        else if (result === true) done(new Error("Should fail when not all rules are fulfilled"));
                        else done();
                    }
                });
            });
        });

        it("throws NoSuchPost on non existing post", function(done) {
            this.timeout(10000);
            const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder,
                { rulesetName: steemprojects1Rulesets.upvoteAllowAuthorNoisy.name,
                    author: "noisy", permlink: "Non-existing-post" + Date.now() }); // author is correct, but post doesnt exist => fail
            wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined) {
                if ((error as ValidationException).validationException) done();
                else if (result === true) done(new Error("Should fail on non existing post"));
                else done(error);
            });
        });

        // TODO unit test custom_rpc
    });
});
