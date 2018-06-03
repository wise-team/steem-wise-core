import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";
import { AuthorsRule, SendVoteorder, Wise, ValidationException, TagsRule } from "../src/wise";

import * as fakeDataset_ from "./data/fake-blockchain.json";
import { FakeApi } from "../src/api/FakeApi";
import { ValidationContext } from "../src/validation/ValidationContext";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

const delegator = "noisy";
const voter = "perduta";
const fakeApi: FakeApi = FakeApi.fromDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/util.spec.ts", () => {
    describe("AuthorsRule", function() {
        it("AllowMode: passes allowed author", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.ALLOW, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "noisy",
                permlink: "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context);
        });

        it("AllowMode: throws ValidationException on different author", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.ALLOW, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "pojan",
                permlink: "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context)
            .then(() => { throw new Error("Should fail"); },
                  (e: Error) => { expect((e as ValidationException).validationException).to.be.true; });
        });

        it("DenyMode: passes on author that is not on the list", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "pojan",
                permlink: "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context);
        });

        it("DenyMode: throws ValidationException on author from the list", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "noisy",
                permlink: "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context)
            .then(() => { throw new Error("Should fail"); },
                  (e: Error) => { expect((e as ValidationException).validationException).to.be.true; });
        });

        it("throws ValidationException on nonexistent post", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "noisy",
                permlink: "nonexistent-post-" + Date.now()
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context)
            .then(() => { throw new Error("Should fail"); },
                  (e: Error) => { expect((e as ValidationException).validationException).to.be.true; });
        });
    });

    describe("TagsRule", function() {
        const tests = [
            {rule: new TagsRule(TagsRule.Mode.ALLOW, ["steemprojects", "steemdev", "suggestion", "input", "busy", "esteem", "nonexistenttag"]),
                author: "cryptoctopus", permlink: "steemprojects-com-a-project-we-should-all-care-about-suggestions",
                pass: true, desc: "has all tags from allow list => pass"},
            {rule: new TagsRule(TagsRule.Mode.ALLOW, ["steemprojects", "steemdev", "suggestion", "input", "busy", "esteem", "nonexistenttag"]),
                author: "nmax83", permlink: "steemprojects-com-sebuah-proyek-yang-seharusnya-kita-semua-peduli-tentang-saran-e78b56ef99562",
                pass: false, desc: "only one of the post tags in not on the list => fail"},
            // TODO continue
            /*{ruleset: steemprojects1Rulesets.upvoteDenyTagSteemprojects, author: "noisy",
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
                pass: false} // it has no one of the required tags => fail*/
        ];
        tests.forEach(test => it(test.rule.mode + ": Should " + (test.pass ? "pass" : "fail") + ": " + test.desc, () => {
            const rule = test.rule;
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: test.author, permlink: test.permlink
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context).then(
                () => { if (!test.pass) throw new Error("Should fail"); },
                (error: Error) => {
                    if (test.pass) throw error;
                    else expect((error as ValidationException).validationException).to.be.true;
                 }
            );
        }));

        it("throws ValidationException on nonexistent post", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "noisy",
                permlink: "nonexistent-post-" + Date.now()
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context)
            .then(() => { throw new Error("Should fail"); },
                  (e: Error) => { expect((e as ValidationException).validationException).to.be.true; });
        });
    });

    // TODO test WeightRule
    // TODO test CustomRPCRule
});
