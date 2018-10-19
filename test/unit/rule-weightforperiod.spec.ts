// 3rd party imports
/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import "mocha";
import { expect, assert } from "chai";
import * as _ from "lodash";
import * as steem from "steem";

// wise imports
import { SendVoteorder, Wise, WeightRule, Api, SteemOperationNumber, Synchronizer, SetRules, ValidationException, EffectuatedWiseOperation, Ruleset } from "../../src/wise";
import { ValidationContext } from "../../src/validation/ValidationContext";
import { FakeWiseFactory } from "../util/FakeWiseFactory";
import { WeightForPeriodRule } from "../../src/rules/WeightForPeriodRule";
import { FakeApi } from "../../src/api/FakeApi";
import { wise_rule_weight_for_period, wise_rule_weight_for_period_encode, wise_rule_weight_for_period_decode } from "../../src/protocol/versions/v2/rules/rule-weight-for-period-schema";
import { ConfirmVote } from "../../src/protocol/ConfirmVote";
import { ConfirmVoteBoundWithVote } from "../../src/protocol/ConfirmVoteBoundWithVote";
import { SynchronizerTestToolkit } from "./util/SynchronizerTestToolkit";

import { Log } from "../../src/util/log";

/* CONFIG */
const delegator = "nonexistentdelegator" + Date.now();
const voterA = "nonexistentvoter_a" + Date.now();
const voterB = "nonexistentvoter_b" + Date.now();

describe("test/unit/rule-weightforperiod.spec.ts", () => {
    describe("WeightForPeriodRule", () => {
        const testsPerPeriod: { name: string, voteorders: { deltaTime: number, weight: number, voter: string; } [], period: number, ruleWeight: number, nextVoteorderWeight: number, voter: string, pass: boolean } [] = [
            { name: "passes when no votes over period 10", pass: true,
              voteorders: [], voter: voterA,
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "fails when too much vote weight in single vote in period", voter: voterA, pass: false,
              voteorders: [ { deltaTime: -10, weight: 101, voter: voterA } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "passes when correct vote weight in single vote in period", voter: voterA, pass: true,
              voteorders: [ { deltaTime: -10, weight: 99, voter: voterA } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "passes when too much vote weight in single vote outside of period", voter: voterA, pass: true,
              voteorders: [ { deltaTime: -12, weight: 101, voter: voterA } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "fails when too much vote weight in two votes in period", voter: voterA, pass: false,
              voteorders: [ { deltaTime: -8, weight: 50, voter: voterA }, { deltaTime: -2, weight: 51, voter: voterA } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "passes when too much vote weight in two votes outside period", voter: voterA, pass: true,
              voteorders: [ { deltaTime: -12, weight: 50, voter: voterA }, { deltaTime: -2, weight: 51, voter: voterA } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "passes when too much vote weight in two votes outside period and one vote is a flag ", voter: voterA, pass: true,
              voteorders: [ { deltaTime: -12, weight: -50, voter: voterA }, { deltaTime: -2, weight: 51, voter: voterA } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "fails when too much vote weight in two votes + new voteorder", voter: voterA, pass: false,
              voteorders: [ { deltaTime: -7, weight: 50, voter: voterA }, { deltaTime: -2, weight: 50, voter: voterA } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
            { name: "passes when too much vote weight in two votes, but the second vote is from different voter", voter: voterA, pass: true,
              voteorders: [ { deltaTime: -7, weight: 50, voter: voterA }, { deltaTime: -2, weight: 50, voter: voterB } ],
              period: 10, ruleWeight: 100, nextVoteorderWeight: 1 },
        ];
        const units: { unit: WeightForPeriodRule.PeriodUnit, multiplier: number } [] = [
            { unit: WeightForPeriodRule.PeriodUnit.SECOND, multiplier: 1 },
            { unit: WeightForPeriodRule.PeriodUnit.MINUTE, multiplier: 60 },
            { unit: WeightForPeriodRule.PeriodUnit.HOUR, multiplier: 60 * 60 },
            { unit: WeightForPeriodRule.PeriodUnit.DAY, multiplier: 24 * 60 * 60 },
        ];
        const tests: { name: string, voteorders: { deltaTime: number, weight: number, voter: string } [], period: number, unit: WeightForPeriodRule.PeriodUnit, ruleWeight: number, nextVoteorderWeight: number, voter: string, pass: boolean } [] = [];

        units.forEach(unit => {
            testsPerPeriod.forEach(t => {
                tests.push({
                    name: t.name, voter: t.voter,
                    voteorders: t.voteorders.map(vo => ({ deltaTime: vo.deltaTime * unit.multiplier, weight: vo.weight, voter: vo.voter })),
                    period: t.period, unit: unit.unit, ruleWeight: t.ruleWeight, nextVoteorderWeight: t.nextVoteorderWeight,
                    pass: t.pass
                });
            });
        });

        const fakeDataset: FakeApi.Dataset = FakeWiseFactory.loadDataset();
        tests.forEach((test, index) => describe(test.name + ", unit: " + test.unit, () => {
            let fakeApi: Api;
            let delegatorWise: Wise;
            let synchronizerToolkit: SynchronizerTestToolkit;
            const nowTime = new Date(Date.now());

            before(function () {
                fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
                delegatorWise = new Wise(delegator, fakeApi);
                synchronizerToolkit = new SynchronizerTestToolkit(delegatorWise);
            });

            it("Starts synchronization without error", () => {
                synchronizerToolkit.start((fakeApi as any as FakeApi).getCurrentBlockNum());
            });

            it("Sets rules", () => {
                const rulesets: Ruleset [] = [
                        { name: "ruleset", rules: [] }
                ];
                const voters: string [] = _.uniq(test.voteorders.map(vo => vo.voter));
                // set rules for each voter in the voteorders
                return BluebirdPromise.resolve(voters).mapSeries(
                    (voter: any /* 'any' because of a bug in BluebirdPromise */) =>
                        delegatorWise.uploadRulesetsForVoter(voter, rulesets)
                )
                .then(() => BluebirdPromise.delay(50));
            });

            test.voteorders.forEach((vo: { deltaTime: number, weight: number, voter: string }) => {
                const fakeTime = new Date(nowTime.getTime() + vo.deltaTime * 1000);
                it("Sends voteorder at time " + fakeTime, () => {
                    const voteorder: SendVoteorder = {
                        rulesetName: "ruleset",
                        weight: vo.weight,
                        author: "noisy",
                        permlink: "nonexistent-post-" + Date.now()
                    };
                    const voterWise = new Wise(vo.voter, fakeApi);
                    (fakeApi as any as FakeApi).setFakeTime(fakeTime);
                    return voterWise.generateVoteorderOperations(delegator, vo.voter, voteorder)
                    .then((ops: steem.OperationWithDescriptor[]) => (fakeApi as any as FakeApi).sendToBlockchain(ops))
                    .then(() => BluebirdPromise.delay(100))
                    .then(() => (fakeApi as any as FakeApi).setFakeTime(new Date(nowTime.getTime())));
                });
            });

            it("ValidationContext.getWiseOperations(voter, until=50 days) returns correct number of voteorders", () => {
                const emptyVoteorder: SendVoteorder = {
                    rulesetName: "",
                    weight: 0,
                    author: "",
                    permlink: ""
                };
                const context = new ValidationContext(fakeApi, delegator, test.voter, emptyVoteorder);
                const until = new Date(nowTime.getTime() - 50 * 24 * 3600 * 1000);
                // calculate for all voters
                const voters: string [] = _.uniq(test.voteorders.map(vo => vo.voter));
                return BluebirdPromise.resolve(voters).mapSeries((voter: any /* 'any' because of a bug in BluebirdPromise */) => context.getWiseOperations(voter/*! voter as we are testing sending, not synchronization !*/, until)
                .then((ops: EffectuatedWiseOperation []) => {
                    ops.forEach(op => {
                        expect(op.timestamp.getTime(), "operation timestamp").to.be.greaterThan(until.getTime(), "until");
                    });
                    return ops.filter(op => SendVoteorder.isSendVoteorder(op.command)).length;
                }))
                .then((counts: number []) => {
                    expect(counts.reduce((a, b) => a + b, 0)).to.be.equal(test.voteorders.length);
                });
            });

            it("ValidationContext.getWiseOperations(delegator, until=50 days) returns correct number of confirmations, all bound with vote operation", () => {
                const emptyVoteorder: SendVoteorder = {
                    rulesetName: "",
                    weight: 0,
                    author: "",
                    permlink: ""
                };

                const context = new ValidationContext(fakeApi, delegator, test.voter, emptyVoteorder);
                const until = new Date(nowTime.getTime() - 50 * 24 * 3600 * 1000);

                return context.getWiseOperations(context.getDelegatorUsername(), until)
                .then((ops: EffectuatedWiseOperation []) => {
                    expect(ops.filter(op => ConfirmVote.isConfirmVote(op.command))).to.be.an("array").with.length(test.voteorders.length);
                    ops.filter(op => ConfirmVote.isConfirmVote(op.command)).forEach(op => {
                        expect((<ConfirmVote>op.command).accepted).to.be.true;
                        expect(ConfirmVoteBoundWithVote.isConfirmVoteBoundWithVote(op.command)).to.be.true;
                    });
                });
            });

            it("Validates rule: " + test.name + ", unit: " + test.unit, () => {
                const voteorder: SendVoteorder = {
                    rulesetName: "ruleset",
                    weight: test.nextVoteorderWeight,
                    author: "noisy",
                    permlink: "nonexistent-post-" + Date.now()
                };
                const context = new ValidationContext(fakeApi, delegator, test.voter, voteorder);
                const rule = new WeightForPeriodRule(test.period, test.unit, test.ruleWeight);
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

            it("Stops synchronization properly", async () => {
                synchronizerToolkit.getSynchronizer().stop();
                await (fakeApi as any as FakeApi).pushFakeBlock();
                await synchronizerToolkit.getSynchronizerPromise().then(() => {});
            });

            it("Ends synchronization without error", async () => {
                await synchronizerToolkit.getSynchronizerPromise().then(() => {});
            });
        }));

        tests.forEach((test, i: number) => it ("is correctly serialized and deserialized by v2", () => {
            const rule = new WeightForPeriodRule(test.period, test.unit, test.ruleWeight);
            const encoded: wise_rule_weight_for_period = wise_rule_weight_for_period_encode(rule);

            const decoded: WeightForPeriodRule = wise_rule_weight_for_period_decode(encoded);
            expect(decoded).to.deep.equal(rule);

            const encoded2: wise_rule_weight_for_period = wise_rule_weight_for_period_encode(decoded);
            expect(encoded2).to.deep.equal(encoded);
        }));
    });
});
