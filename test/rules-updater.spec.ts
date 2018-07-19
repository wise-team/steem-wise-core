// 3rd party imports
import { expect } from "chai";
import { Promise } from "bluebird";
import "mocha";
import * as _ from "lodash";

// wise imports
import { AuthorsRule, Wise, TagsRule, WeightRule, SteemOperationNumber, SetRules, SetRulesForVoter, Api } from "../src/wise";
import { FakeApi } from "../src/api/FakeApi";
import { FakeWiseFactory } from "./util/FakeWiseFactory";

/* CONFIG */
const delegator = "nonexistent-delegator-" + Date.now();
const voterA = "nonexistent-voter-a-" + Date.now();
const voterB = "nonexistent-voter-b-" + Date.now();
const voterC = "nonexistent-voter-c-" + Date.now();
const fakeApi: Api = FakeWiseFactory.buildFakeApi();

const delegatorWise = new Wise(delegator, fakeApi);
const voterAWise = new Wise(voterA, fakeApi);
const voterBWise = new Wise(voterB, fakeApi);
const voterCWise = new Wise(voterC, fakeApi);


describe("test/rules-updater.spec.ts", () => {
    describe("RulesUpdater", function() {
        const rules0: SetRulesForVoter [] = [
            {
                voter: voterA,
                rulesets: [{
                    name: "a",
                    rules: [
                        new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100),
                        new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects"])
                    ]
                }]
            },
            {
                voter: voterB,
                rulesets: [{
                    name: "b",
                    rules: [
                        new AuthorsRule(AuthorsRule.Mode.ALLOW, ["noisy"])
                    ]
                }]
            }
        ];
        it("Sets initial rules", () => {
            return delegatorWise.diffAndUpdateRulesAsync(rules0)
            .then((result: SteemOperationNumber | true) => {
                expect(result !== true, "rules were actually updated").to.be.true;
                expect((result as SteemOperationNumber).blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(10))
            .then(() => voterAWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(1);
                expect(rules.rulesets[0].name).to.be.equal("a");
                expect(rules.rulesets).to.deep.equal(rules0[0].rulesets);
                expect(_.isEqual(rules.rulesets, rules0[0].rulesets), "_.isEqual").to.be.true;
            })
            .then(() => voterBWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(1);
                expect(rules.rulesets).to.deep.equal(rules0[1].rulesets);
                expect(_.isEqual(rules.rulesets, rules0[1].rulesets), "_.isEqual").to.be.true;
            });
        });


        it("Does not update same rules", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules0))
            .then((result: SteemOperationNumber | true) => {
                expect(result === true, "rules were not updated").to.be.true;
            });
        });


        const rules1 = _.cloneDeep(rules0);
        const additionalRuleForVoterC = {
                voter: voterC,
                rulesets: [{
                    name: "c",
                    rules: [
                        new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 100),
                        new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects"])
                    ]
                }]
            };
        rules1.push(additionalRuleForVoterC);

        it("Updates on added new voter", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules1))
            .then((result: SteemOperationNumber | true) => {
                expect(result !== true, "rules were actually updated").to.be.true;
                expect((result as SteemOperationNumber).blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(10))
            .then(() => voterCWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(1);
                expect(rules.rulesets[0].name).to.be.equal("c");
                expect(rules.rulesets).to.deep.equal(rules1[2].rulesets);
            });
        });

        const rules2 = _.slice(_.cloneDeep(rules1), 1); // remove first element
        it("Updates on removed voter", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules2))
            .then((result: SteemOperationNumber | true) => {
                expect(result !== true, "rules were actually updated").to.be.true;
                expect((result as SteemOperationNumber).blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(25))
            .then(() => voterAWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(0);
            });
        });

        const rules3 = _.cloneDeep(rules2); // modify rules for voter c
        (rules3[rules3.length - 1].rulesets[0].rules[0] as WeightRule).max = 50;
        it("Updates on modified weight rule numbered property", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules3))
            .then((result: SteemOperationNumber | true) => {
                expect(result !== true, "rules were actually updated").to.be.true;
                expect((result as SteemOperationNumber).blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(25))
            .then(() => voterCWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(1);
                expect(rules.rulesets[0].name).to.be.equal("c");
                expect(rules.rulesets).to.deep.equal(rules3[rules3.length - 1].rulesets);
            });
        });

        const rules4 = _.cloneDeep(rules3); // modify rules for voter c
        (rules4[rules4.length - 1].rulesets[0].rules[1] as TagsRule).mode = TagsRule.Mode.DENY;
        it("Updates on modified tags rule enum property", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules4))
            .then((result: SteemOperationNumber | true) => {
                expect(result !== true, "rules were actually updated").to.be.true;
                expect((result as SteemOperationNumber).blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(25))
            .then(() => voterCWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(1);
                expect(rules.rulesets[0].name).to.be.equal("c");
                expect(rules.rulesets).to.deep.equal(rules4[rules4.length - 1].rulesets);
            });
        });

        const rules5 = _.cloneDeep(rules4); // modify rules for voter c
        (rules5[rules5.length - 1].rulesets[0].rules[1] as TagsRule).tags.push("sometag");
        it("Updates on modified tags array", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules5))
            .then((result: SteemOperationNumber | true) => {
                expect(result !== true, "rules were actually updated").to.be.true;
                expect((result as SteemOperationNumber).blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(25))
            .then(() => voterCWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(1);
                expect(rules.rulesets[0].name).to.be.equal("c");
                expect(rules.rulesets).to.deep.equal(rules5[rules5.length - 1].rulesets);
            });
        });

        const rules6 = _.cloneDeep(rules5);
        it("Does not update on same but deeply cloned rules", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules6))
            .then((result: SteemOperationNumber | true) => {
                expect(result === true, "rules were not updated").to.be.true;
            });
        });

        const rules7 = JSON.parse(JSON.stringify(_.cloneDeep(rules6)));
        it("Does not update unchanged unprototyped rules object", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules7))
            .then((result: SteemOperationNumber | true) => {
                expect(result === true, "rules were not updated").to.be.true;
            });
        });

        const rules8 = JSON.parse(JSON.stringify(_.cloneDeep(rules0))); // copy of rules0
        it("Correctly appends prototype to unprototyped rules and updates them", () => {
            return Promise.delay(10)
            .then(() => delegatorWise.diffAndUpdateRulesAsync(rules8))
            .then((result: SteemOperationNumber | true) => {
                expect(result !== true, "rules were actually updated").to.be.true;
                expect((result as SteemOperationNumber).blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(10))
            .then(() => voterAWise.getRulesetsAsync(delegator))
            .then((rules: SetRules) => {
                expect(rules.rulesets).to.be.an("array").with.length(1);
                expect(rules.rulesets[0].name).to.be.equal("a");
                expect(rules.rulesets).to.deep.equal(rules0[0].rulesets);
                expect(_.isEqual(rules.rulesets, rules0[0].rulesets), "_.isEqual").to.be.true;
            });
        });
    });
});
