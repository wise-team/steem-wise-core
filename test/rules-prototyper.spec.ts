// 3rd party imports
import { expect } from "chai";
import { Promise } from "bluebird";
import "mocha";
import * as _ from "lodash";
import { Log } from "../src/util/log"; const log = Log.getLogger(); Log.setLevel("info");

// wise imports
import { AuthorsRule, SendVoteorder, TagsRule, WeightRule, CustomRPCRule, VotingPowerRule } from "../src/wise";
import { Rule } from "../src/rules/Rule";
import { RulePrototyper } from "../src/rules/RulePrototyper";


describe("test/rules-prototyper.spec.ts", () => {
    describe("RulesPrototyper", () => {
        it ("Unserialized rules are equal to serialized after prototyping", () => {
            const rulesPrimary: Rule [] = [
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
            ];

            const rulesUnprototyped = JSON.parse(JSON.stringify(rulesPrimary));
            const rulesPrototyped = rulesUnprototyped.map((rule: Rule) => RulePrototyper.fromUnprototypedRule(rule));

            rulesPrototyped.forEach((rule: Rule) => expect(rule).to.have.property("validate"));

            expect(rulesUnprototyped).to.not.equal(rulesPrimary);
            expect(rulesUnprototyped, "rulesUnprototyped").to.not.deep.equal(rulesPrimary, "rulesPrimary");
            expect(rulesPrototyped, "rulesPrototyped").to.deep.equal(rulesPrimary, "rulesPrimary");
        });

        const rulesForReprototypingTest: [Rule, string] [] = [
            [new WeightRule(0, 100), "min"],
            [new AuthorsRule(AuthorsRule.Mode.DENY, ["perduta"]), "authors"],
            [new TagsRule(TagsRule.Mode.DENY, ["steemit"]), "tags"],
            [new CustomRPCRule("a", 2, "c", "d"), "host"],
            [new VotingPowerRule(VotingPowerRule.Mode.EQUAL, 5), "value"]
        ];
        rulesForReprototypingTest.forEach((rulePair, index) =>  it("Reprototyping fails if reprototyped rule misses a property (" + rulePair[0].type() + ")", () => {
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

                let hadThrown: boolean = false;
                try {
                    const ruleOmitedReprototyped = RulePrototyper.fromUnprototypedRule(ruleOmitedUnprototyped);
                    expect(ruleOmitedReprototyped).to.not.equal(rulePrimary);
                    expect(ruleOmitedReprototyped).to.not.deep.equal(rulePrimary);
                    expect(ruleOmitedReprototyped).to.have.property("validate");
                } catch (e) {
                    hadThrown = true;
                }
                expect(hadThrown, "RulePrototyper.fromUnprototypedRule should throw").to.be.true;
            });
        }));
    });

    // TODO test CustomRPCRule
});
