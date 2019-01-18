// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../log/Log";
import * as steem from "steem";

// wise imports
import { VotingPowerRule, SendVoteorder, ValidationException, Wise } from "../wise";
import { ValidationContext } from "../validation/ValidationContext";
import { FakeWiseFactory } from "../_test/util/FakeWiseFactory";
import {
    wise_rule_voting_power_encode,
    wise_rule_voting_power_decode,
    wise_rule_voting_power,
} from "../protocol/versions/v2/rules/rule-voting-power-schema";

/* CONFIG */
const voter = "perduta";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/unit/rule-votingpower.spec.ts", () => {
    describe("VotingPowerRule", function() {
        const tests: { mode: VotingPowerRule.Mode; ruleValue: number; testValue: number; pass: boolean }[] = [
            {
                mode: VotingPowerRule.Mode.EQUAL,
                ruleValue: 1000,
                testValue: 1000,
                pass: true,
            },
            {
                mode: VotingPowerRule.Mode.EQUAL,
                ruleValue: 1000,
                testValue: 999,
                pass: false,
            },
            {
                mode: VotingPowerRule.Mode.EQUAL,
                ruleValue: 1000,
                testValue: 1001,
                pass: false,
            },
            {
                mode: VotingPowerRule.Mode.MORE_THAN,
                ruleValue: 1000,
                testValue: 1000,
                pass: false,
            },
            {
                mode: VotingPowerRule.Mode.MORE_THAN,
                ruleValue: 1000,
                testValue: 1001,
                pass: true,
            },
            {
                mode: VotingPowerRule.Mode.MORE_THAN,
                ruleValue: 1000,
                testValue: 999,
                pass: false,
            },
            {
                mode: VotingPowerRule.Mode.LESS_THAN,
                ruleValue: 1000,
                testValue: 1000,
                pass: false,
            },
            {
                mode: VotingPowerRule.Mode.LESS_THAN,
                ruleValue: 1000,
                testValue: 1001,
                pass: false,
            },
            {
                mode: VotingPowerRule.Mode.LESS_THAN,
                ruleValue: 1000,
                testValue: 999,
                pass: true,
            },
        ];

        tests.forEach((testMode, i: number) =>
            it(
                "VotingPowerRule " +
                    (testMode.pass ? "should pass" : "should fail") +
                    ": " +
                    testMode.testValue +
                    " " +
                    testMode.mode +
                    " " +
                    testMode.ruleValue,
                () => {
                    const rule = new VotingPowerRule(testMode.mode, testMode.ruleValue);
                    const delegatorAI = {
                        name: "delegator-" + i,
                        voting_power: testMode.testValue,
                    };
                    fakeDataset.accounts.push((delegatorAI as object) as steem.AccountInfo);
                    const voteorder: SendVoteorder = {
                        rulesetName: "",
                        weight: 1,
                        author: "noisy",
                        permlink:
                            "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that",
                    };
                    const context = new ValidationContext(fakeApi, delegatorAI.name, voter, voteorder);

                    return rule.validate(voteorder, context).then(
                        () => {
                            // passed
                            if (!testMode.pass) throw new Error("Should fail");
                        },
                        error => {
                            // failed
                            if (testMode.pass) throw error;
                            else {
                                if (!(error as ValidationException).validationException)
                                    throw new Error("Should fail with ValidationException");
                            }
                        }
                    );
                }
            )
        );

        tests.forEach((test, i: number) =>
            it("is correctly serialized and deserialized by v2", () => {
                const rule = new VotingPowerRule(test.mode, test.ruleValue);
                const encoded: wise_rule_voting_power = wise_rule_voting_power_encode(rule);

                const decoded: VotingPowerRule = wise_rule_voting_power_decode(encoded);
                expect(decoded).to.deep.equal(rule);

                const encoded2: wise_rule_voting_power = wise_rule_voting_power_encode(decoded);
                expect(encoded2).to.deep.equal(encoded);
            })
        );
    });
});
