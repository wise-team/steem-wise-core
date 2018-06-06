import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";
import * as _ from "lodash";

import { AuthorsRule, SendVoteorder, Wise, ValidationException, TagsRule, WeightRule, CustomRPCRule } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { Rule } from "../src/rules/Rule";
import { RulePrototyper } from "../src/rules/RulePrototyper";

import { FakeApi } from "../src/api/FakeApi";
import * as fakeDataset_ from "./data/fake-blockchain.json";
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

    describe("WeightRule", () => {
        const voteorder: SendVoteorder = {
            rulesetName: "",
            weight: 1,
            author: "noisy",
            permlink: "nonexistent-post-" + Date.now()
        };
        const context = new ValidationContext(fakeApi, delegator, voter, voteorder);

        describe("mode = SINGLE_VOTE_WEIGHT", () => {
            it ("allows 0 <= 50 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 50);
                return rule.validate(vo, context);
            });

            it ("allows 0 <= 0 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context);
            });

            it ("allows 0 <= 100 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context);
            });

            it ("allows -100 <= 0 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context);
            });

            it ("allows -100 <= -100 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", -100);
                return rule.validate(vo, context);
            });

            it ("rejects -100 <= -101 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", -101);
                return rule.validate(vo, context)
                .then(() => { throw new Error("Should fail"); }, () => {});
            });

            it ("rejects -100 <= 101 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, -100, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 101);
                return rule.validate(vo, context)
                .then(() => { throw new Error("Should fail"); }, () => {});
            });

            it ("rejects 10 <= 0 <= 100", () => {
                const rule = new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 10, 100);
                const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
                return rule.validate(vo, context)
                .then(() => { throw new Error("Should fail"); }, () => {});
            });
        });
    });

    describe("RulePrototyper", () => {
        it ("Unserialized rules are equal to serialized after prototyping", () => {
            const rulesPrimary: Rule [] = [
                new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100),
                new AuthorsRule(AuthorsRule.Mode.DENY, ["1"]),
                new AuthorsRule(AuthorsRule.Mode.ALLOW, []),
                new AuthorsRule(AuthorsRule.Mode.ALLOW, ["1"]),
                new AuthorsRule(AuthorsRule.Mode.ALLOW, ["1", "2"]),
                new TagsRule(TagsRule.Mode.ALLOW, ["1", "2"]),
                new TagsRule(TagsRule.Mode.DENY, ["1", "2"]),
                new TagsRule(TagsRule.Mode.REQUIRE, ["1", "2"]),
                new TagsRule(TagsRule.Mode.ANY, ["1", "2"]),
                new CustomRPCRule("a", 2, "c", "d")
            ];

            const rulesUnprototyped = JSON.parse(JSON.stringify(rulesPrimary));
            const rulesPrototyped = rulesUnprototyped.map((rule: Rule) => RulePrototyper.fromUnprototypedRule(rule));

            rulesPrototyped.forEach((rule: Rule) => expect(rule).to.have.property("validate"));

            expect(rulesUnprototyped).to.not.equal(rulesPrimary);
            expect(rulesUnprototyped).to.not.deep.equal(rulesPrimary);

            expect(rulesPrototyped).to.deep.equal(rulesPrimary);
        });

        const rulesForReprototypingTest: [Rule, string] [] = [
            [new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100), "min"],
            [new AuthorsRule(AuthorsRule.Mode.DENY, ["perduta"]), "authors"],
            [new TagsRule(TagsRule.Mode.DENY, ["steemit"]), "tags"],
            [new CustomRPCRule("a", 2, "c", "d"), "host"]
        ];
        rulesForReprototypingTest.forEach((rulePair, index) =>  it("Validation quickly fails if reprototyped rule misses a property (" + rulePair[0].type() + ")", function () {
            this.timeout(100);
            const vo: SendVoteorder = {
                weight: 10,
                author: "noisy",
                permlink: "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that",
                rulesetName: ""
            };

            return Promise.resolve().then(() => {
                const rulePrimary = rulePair[0];
                const propertyToOmit = rulePair[1];

                const omitedRule = _.omit(rulePrimary, propertyToOmit);
                expect(omitedRule).to.not.equal(rulePrimary);
                expect(omitedRule).to.not.deep.equal(rulePrimary);

                const ruleOmitedUnprototyped = JSON.parse(JSON.stringify(omitedRule));
                expect(ruleOmitedUnprototyped).to.not.equal(omitedRule);
                expect(ruleOmitedUnprototyped).to.not.deep.equal(omitedRule);

                const ruleOmitedReprototyped = RulePrototyper.fromUnprototypedRule(ruleOmitedUnprototyped);
                expect(ruleOmitedReprototyped).to.not.equal(rulePrimary);
                expect(ruleOmitedReprototyped).to.not.deep.equal(rulePrimary);
                expect(ruleOmitedReprototyped).to.have.property("validate");

                return ruleOmitedReprototyped.validate(vo, new ValidationContext(fakeApi, delegator, voter, vo))
                .then(() => { throw new Error("Should fail"); }, (e) => {});
            });
        }));
    });

    // TODO test CustomRPCRule
});
