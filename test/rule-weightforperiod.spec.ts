// 3rd party imports
import "mocha";
import { expect, assert } from "chai";
import * as _ from "lodash";
import * as Promise from "bluebird";
import * as log from "loglevel";

// wise imports
import { SendVoteorder, Wise, WeightRule, Api, SteemOperationNumber, Synchronizer, SetRules, ValidationException, EffectuatedSmartvotesOperation } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { FakeWiseFactory } from "./util/FakeWiseFactory";
import { WeightForPeriodRule } from "../src/rules/WeightForPeriodRule";
import { FakeApi } from "../src/api/FakeApi";
import { isSendVoteorder } from "../src/protocol/SendVoteorder";
import { isConfirmVote, ConfirmVote, isConfirmVoteBoundWithVote } from "../src/protocol/ConfirmVote";
import { wise_rule_weight_for_period, wise_rule_weight_for_period_encode, wise_rule_weight_for_period_decode } from "../src/protocol/versions/v2/rules/rule-weight-for-period-schema";

/* CONFIG */
const delegator = "nonexistentdelegator" + Date.now();
const voter = "nonexistentvoter" + Date.now();

describe("test/rule-weightforperiod.spec.ts", () => {
    describe("WeightForPeriodRule", () => {
        const testsPerPeriod: { name: string, voteorders: { deltaTime: number, weight: number} [], period: number; weight: number, pass: boolean } [] = [
            { name: "passes when no votes over period 10", pass: true,
              voteorders: [],
              period: 10, weight: 100 },
            { name: "fails when too much vote weight in single vote in period", pass: false,
              voteorders: [ { deltaTime: -10, weight: 101 } ],
              period: 10, weight: 100 },
            { name: "passes when correct vote weight in single vote in period", pass: true,
              voteorders: [ { deltaTime: -10, weight: 99 } ],
              period: 10, weight: 100 },
            { name: "passes when too much vote weight in single vote outside of period", pass: true,
              voteorders: [ { deltaTime: -12, weight: 101 } ],
              period: 10, weight: 100 },
            { name: "fails when too much vote weight in two votes in period", pass: false,
              voteorders: [ { deltaTime: -8, weight: 50 }, { deltaTime: -2, weight: 51 } ],
              period: 10, weight: 100 },
            { name: "passes when too much vote weight in two votes outside period", pass: true,
              voteorders: [ { deltaTime: -12, weight: 50 }, { deltaTime: -2, weight: 51 } ],
              period: 10, weight: 100 },
        ];
        const units: { unit: WeightForPeriodRule.PeriodUnit, multiplier: number } [] = [
            { unit: WeightForPeriodRule.PeriodUnit.SECOND, multiplier: 1 },
            { unit: WeightForPeriodRule.PeriodUnit.MINUTE, multiplier: 60 },
            { unit: WeightForPeriodRule.PeriodUnit.HOUR, multiplier: 60 * 60 },
            { unit: WeightForPeriodRule.PeriodUnit.DAY, multiplier: 24 * 60 * 60 },
        ];
        const tests: { name: string, voteorders: { deltaTime: number, weight: number} [], period: number; unit: WeightForPeriodRule.PeriodUnit, weight: number, pass: boolean } [] = [];

        units.forEach(unit => {
            testsPerPeriod.forEach(t => {
                tests.push({
                    name: t.name,
                    voteorders: t.voteorders.map(vo => ({ deltaTime: vo.deltaTime * unit.multiplier, weight: vo.weight})),
                    period: t.period, unit: unit.unit, weight: t.weight, pass: t.pass
                });
            });
        });

        tests.forEach(test => describe(test.name + ", unit: " + test.unit, () => {
            const fakeApi: Api = FakeWiseFactory.buildFakeApi();
            const delegatorWise = new Wise(delegator, fakeApi);
            const voterWise = new Wise(voter, fakeApi);

            const nowTime = new Date(Date.now());

            let synchronizer: Synchronizer;
            let synchronizationPromise: Promise<void>;

            it("Starts synchronization without error", () => {
                const synchronizationPromiseReturner = () => new Promise<void>((resolve, reject) => {
                    synchronizer = delegatorWise.runSynchronizerLoop(new SteemOperationNumber((fakeApi as FakeApi).getCurrentBlockNum(), 0, 0),
                        (error: Error | undefined, event: Synchronizer.Event): void => {
                        if (event.type === Synchronizer.EventType.SynchronizationStop) {
                            resolve();
                        }
                        // if (event.type === Synchronizer.EventType.OperarionsPushed) log.info(event);

                        if (error) {
                            reject(error);
                            synchronizer.stop();
                        }
                    });
                    synchronizer.setTimeout(800);
                });
                synchronizationPromise = synchronizationPromiseReturner();
            });

            it("Sets rules", () => {
                const rules: SetRules = {
                    rulesets: [
                        { name: "ruleset", rules: [] }
                    ]
                };
                return delegatorWise.sendRulesAsync(voter, rules)
                .then(() => Promise.delay(50));
            });

            test.voteorders.forEach((vo: { deltaTime: number, weight: number}) => {
                const fakeTime = new Date(nowTime.getTime() + vo.deltaTime * 1000);
                it("Sends voteorder at time " + fakeTime, () => {
                    const voteorder: SendVoteorder = {
                        rulesetName: "ruleset",
                        weight: vo.weight,
                        author: "noisy",
                        permlink: "nonexistent-post-" + Date.now()
                    };
                    (fakeApi as FakeApi).setFakeTime(fakeTime);
                    return voterWise.generateVoteorderCustomJSONAsync(delegator, voteorder)
                    .then((ops: [string, object][]) => (fakeApi as FakeApi).sendToBlockchain(ops))
                    .then(() => Promise.delay(60))
                    .then(() => (fakeApi as FakeApi).setFakeTime(new Date(nowTime.getTime())));
                });
            });

            it("ValidationContext.getWiseOperations(voter, until=50 days) returns correct number of voteorders", () => {
                const emptyVoteorder: SendVoteorder = {
                    rulesetName: "",
                    weight: 0,
                    author: "",
                    permlink: ""
                };
                const context = new ValidationContext(fakeApi, voterWise.getProtocol(), delegator, voter, emptyVoteorder);
                const until = new Date(nowTime.getTime() - 50 * 24 * 3600 * 1000);
                return context.getWiseOperations(context.getVoterUsername()/*! voter as we are testing sending, not synchronization !*/, until)
                .then((ops: EffectuatedSmartvotesOperation []) => {
                    expect(ops.filter(op => isSendVoteorder(op.command))).to.be.an("array").with.length(test.voteorders.length);
                    ops.forEach(op => {
                        expect(op.timestamp.getTime(), "operation timestamp").to.be.greaterThan(until.getTime(), "until");
                    });
                });
            });

            it("ValidationContext.getWiseOperations(delegator, until=50 days) returns correct number of confirmations, all bound with vote operation", () => {
                const emptyVoteorder: SendVoteorder = {
                    rulesetName: "",
                    weight: 0,
                    author: "",
                    permlink: ""
                };
                const context = new ValidationContext(fakeApi, voterWise.getProtocol(), delegator, voter, emptyVoteorder);
                const until = new Date(nowTime.getTime() - 50 * 24 * 3600 * 1000);
                return context.getWiseOperations(context.getDelegatorUsername(), until)
                .then((ops: EffectuatedSmartvotesOperation []) => {
                    expect(ops.filter(op => isConfirmVote(op.command))).to.be.an("array").with.length(test.voteorders.length);
                    ops.filter(op => isConfirmVote(op.command)).forEach(op => {
                        expect((<ConfirmVote>op.command).accepted).to.be.true;
                        expect(isConfirmVoteBoundWithVote(op.command)).to.be.true;
                    });
                });
            });

            it("Validates rule: " + test.name + ", unit: " + test.unit, () => {
                const voteorder: SendVoteorder = {
                    rulesetName: "ruleset",
                    weight: 1,
                    author: "noisy",
                    permlink: "nonexistent-post-" + Date.now()
                };
                const context = new ValidationContext(fakeApi, voterWise.getProtocol(), delegator, voter, voteorder);
                const rule = new WeightForPeriodRule(test.period, test.unit, test.weight);
                return rule.validate(voteorder, context, nowTime)
                .then (() => {
                    if (!test.pass) throw new Error("Should fail");
                }, (error: Error) => {
                    if (test.pass) throw error;
                    else if (!(<ValidationException>error).validationException) {
                        throw error;
                    }
                });
            });

            it("Stops synchronization properly", () => {
                synchronizer.stop();
                return (fakeApi as FakeApi).pushFakeBlock().then((son: SteemOperationNumber) => {
                    return synchronizationPromise.then(() => {});
                }).then(() => {});
            });

            it("Ends synchronization without error", () => {
                return synchronizationPromise.then(() => {});
            });
        }));

        tests.forEach((test, i: number) => it ("is correctly serialized and deserialized by v2", () => {
            const rule = new WeightForPeriodRule(test.period, test.unit, test.weight);
            const encoded: wise_rule_weight_for_period = wise_rule_weight_for_period_encode(rule);

            const decoded: WeightForPeriodRule = wise_rule_weight_for_period_decode(encoded);
            expect(decoded).to.deep.equal(rule);

            const encoded2: wise_rule_weight_for_period = wise_rule_weight_for_period_encode(decoded);
            expect(encoded2).to.deep.equal(encoded);
        }));

        // TODO test if it does not count other voter votes
    });
});
