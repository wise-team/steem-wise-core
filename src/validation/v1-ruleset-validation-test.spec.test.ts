// 3rd party imports
import "mocha";
import { expect } from "chai";
import * as _ from "lodash";

// wise imports
import { Util } from "../../src/util/util";
import { SteemOperationNumber, Wise, SendVoteorder, ValidationException, AuthorsRule, TagsRule } from "../../src/wise";


/* PREPARE TESTING DATASETS */
import * as steemprojects1Rulesets from "../data/steemprojects1-rulesets";
import { FakeWiseFactory } from "../util/FakeWiseFactory";


describe("test/unit/v1-ruleset-validation-test.spec.ts", () => {
    describe("RulesValidator.validateVoteOrder [delegator=steemprojects1, voter=guest123]", () => {

        const voter = "guest123";
        const delegator = "steemprojects1";
        const validVoteorder: SendVoteorder = {
            rulesetName: <string> steemprojects1Rulesets.upvoteAllowAuthorNoisy.name,
            author: "noisy",
            permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
            weight: 1,
        };
        const rulesetMomentForValidation: SteemOperationNumber = new SteemOperationNumber(22144059, 32, 0).addTransactions(1); // Moment just after tx_id = 7fe4a1a4efadb1230c41c2c865df15d91eb3c452
        let wise: Wise;

        before(() => {
            wise = new Wise(voter, FakeWiseFactory.buildFakeApi());
        });

        it("passes valid voteorder", async () => {
            const voteorder = validVoteorder;
            const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
            expect(result === true).to.be.true;
        });

        it("fails on empty voteorder", async () => {
                        const voteorder = JSON.parse("{}") as SendVoteorder;

            const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
            expect (result === true).to.be.false;
            expect (ValidationException.isValidationException(result)).to.be.true;
        });

        ["rulesetName", "author", "permlink", "weight"].forEach(function(prop: string) {
            it("fails on empty " + prop, async () => {
                                const voteorder: SendVoteorder = _.omit(_.cloneDeep(validVoteorder), [prop]) as SendVoteorder;

                const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
                expect (result === true).to.be.false;
                expect (ValidationException.isValidationException(result)).to.be.true;
            });
        });

        [-10001, 100001, undefined, NaN, 3, 200, Infinity].forEach(function(weight) {
            it("fails on invald weight (" + weight + ")", async () => {
                                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: weight });

                const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
                expect (result === true).to.be.false;
                expect (ValidationException.isValidationException(result)).to.be.true;
            });
        });


        it("allows valid weight (2)", async () => {
                        const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: 2 });

            const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
            expect (result === true).to.be.true;
        });

        it("fails on nonexistent ruleset", async () => {
                        const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: "NonExistent" + Date.now() });

            const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
            expect (result === true).to.be.false;
            expect (ValidationException.isValidationException(result)).to.be.true;
        });

        it("fails on different voter", async () => {
                        const voteorder: SendVoteorder = validVoteorder;

            const result = await wise.validateVoteorder(delegator, "NonExistent-voter-" + Date.now(), voteorder, rulesetMomentForValidation);
            expect (result === true).to.be.false;
            expect (ValidationException.isValidationException(result)).to.be.true;
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
            it((voteorderCase.pass ? "passes on allowed" : "fails on disallowed") + " author [ruleset=\"" + voteorderCase.ruleset.name + "\", allowed=" + (voteorderCase.ruleset.rules[0] as AuthorsRule).authors.join() + ", tested=" + voteorderCase.author + "]", async () => {
                                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });

                const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
                if (voteorderCase.pass) {
                    expect (result === true).to.be.true;
                }
                else {
                    expect (result === true).to.be.false;
                    expect (ValidationException.isValidationException(result)).to.be.true;
                }
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
            + " post=@" + voteorderCase.author + "/" + voteorderCase.permlink + "]", async () => {
                                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });


                const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
                if (voteorderCase.pass) {
                    expect (result === true).to.be.true;
                }
                else {
                    expect (result === true).to.be.false;
                    expect (ValidationException.isValidationException(result)).to.be.true;
                }
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
            + " post=@" + voteorderCase.author + "/" + voteorderCase.permlink + "]", async () => {
                                const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder, { rulesetName: voteorderCase.ruleset.name, author: voteorderCase.author, permlink: voteorderCase.permlink });
                const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
                if (voteorderCase.pass) {
                    expect (result === true).to.be.true;
                }
                else {
                    expect (result === true).to.be.false;
                    expect (ValidationException.isValidationException(result)).to.be.true;
                }
            });
        });

        it("throws ValidationException on non existing post", async () => {
                        const voteorder: SendVoteorder = Util.objectAssign({}, validVoteorder,
                { rulesetName: steemprojects1Rulesets.upvoteAllowAuthorNoisy.name,
                    author: "noisy", permlink: "Non-existing-post" + Date.now() }); // author is correct, but post doesnt exist => fail
            const result = await wise.validateVoteorder(delegator, voter, voteorder, rulesetMomentForValidation);
            expect (result === true).to.be.false;
            expect (ValidationException.isValidationException(result)).to.be.true;
        });
    });
});
