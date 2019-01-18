// 3rd party imports
/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import { expect } from "chai";
import "mocha";
import * as _ from "lodash";
import { Log } from "../log/Log";

// wise imports
import {
    AuthorsRule,
    SendVoteorder,
    TagsRule,
    WeightRule,
    CustomRPCRule,
    VotingPowerRule,
    ExpirationDateRule,
} from "../wise";
import { Rule } from "../rules/Rule";
import { RulePrototyper } from "../rules/RulePrototyper";

describe("test/unit/rules-prototyper.spec.ts", () => {
    describe("RulesPrototyper", () => {
        it("Unserialized rules are equal to serialized after prototyping", () => {
            const rulesPrimary: Rule[] = [
                new WeightRule(0, 100),
                new AuthorsRule(AuthorsRule.Mode.DENY, ["1"]),
                new AuthorsRule(AuthorsRule.Mode.ALLOW, []),
                new AuthorsRule(AuthorsRule.Mode.ALLOW, ["1"]),
                new AuthorsRule(AuthorsRule.Mode.ALLOW, ["1", "2"]),
                new TagsRule(TagsRule.Mode.ALLOW, ["1", "2"]),
                new TagsRule(TagsRule.Mode.DENY, ["1", "2"]),
                new TagsRule(TagsRule.Mode.REQUIRE, ["1", "2"]),
                new TagsRule(TagsRule.Mode.ANY, ["1", "2"]),
                new CustomRPCRule("a", 2, "c", "d"),
                new VotingPowerRule(VotingPowerRule.Mode.EQUAL, 5),
                new VotingPowerRule(VotingPowerRule.Mode.LESS_THAN, 5),
                new VotingPowerRule(VotingPowerRule.Mode.MORE_THAN, 5),
                new ExpirationDateRule(new Date(Date.now() + 60 * 1000).toISOString()),
            ];

            const rulesUnprototyped = JSON.parse(JSON.stringify(rulesPrimary));
            const rulesPrototyped = rulesUnprototyped.map((rule: Rule) => RulePrototyper.fromUnprototypedRule(rule));

            rulesPrototyped.forEach((rule: Rule) => expect(rule).to.have.property("validate"));

            expect(rulesUnprototyped).to.not.equal(rulesPrimary);
            expect(_.isEqual(rulesUnprototyped, rulesPrimary)).to.be.false;
            expect(_.isEqual(rulesPrototyped, rulesPrimary)).to.be.true;
        });

        const rulesForReprototypingTest: [Rule, string][] = [
            [new WeightRule(0, 100), "min"],
            [new AuthorsRule(AuthorsRule.Mode.DENY, ["perduta"]), "authors"],
            [new TagsRule(TagsRule.Mode.DENY, ["steemit"]), "tags"],
            [new CustomRPCRule("a", 2, "c", "d"), "host"],
            [new VotingPowerRule(VotingPowerRule.Mode.EQUAL, 5), "value"],
        ];
        rulesForReprototypingTest.forEach((rulePair, index) =>
            it("Reprototyping fails if reprototyped rule misses a property (" + rulePair[0].type() + ")", () => {
                const vo: SendVoteorder = {
                    weight: 10,
                    author: "noisy",
                    permlink:
                        "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that",
                    rulesetName: "",
                };

                return BluebirdPromise.resolve().then(() => {
                    const rulePrimary = rulePair[0];
                    const propertyToOmit = rulePair[1];

                    const omitedRule = _.omit(rulePrimary, propertyToOmit);
                    expect(omitedRule).to.not.equal(rulePrimary);
                    expect(omitedRule).to.not.deep.equal(rulePrimary);

                    const ruleOmitedUnprototyped = JSON.parse(JSON.stringify(omitedRule));
                    expect(ruleOmitedUnprototyped).to.not.equal(omitedRule);
                    // expect(ruleOmitedUnprototyped).to.not.deep.equal(omitedRule);

                    let hadThrown: boolean = false;
                    try {
                        const ruleOmitedReprototyped = RulePrototyper.fromUnprototypedRule(ruleOmitedUnprototyped);
                        expect(ruleOmitedReprototyped).to.not.equal(rulePrimary);
                        expect(_.isEqual(ruleOmitedReprototyped, rulePrimary)).to.be.false;
                        expect(ruleOmitedReprototyped).to.have.property("validate");
                    } catch (e) {
                        hadThrown = true;
                    }
                    expect(hadThrown, "RulePrototyper.fromUnprototypedRule should throw").to.be.true;
                });
            })
        );
    });
});
