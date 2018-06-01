// TODO test Synchronizator with FakeApi

import { expect, assert } from "chai";
import * as Promise from "bluebird";
import * as _ from "lodash";
import "mocha";

import { Wise, SteemOperationNumber, SendVoteorder, SetRules, AuthorsRule, WeightRule } from "../src/wise";
import { SteemPost } from "../src/blockchain/SteemPost";
import { FakeApi } from "../src/api/FakeApi";
import { Util } from "../src/util/util";

import * as fakeDataset_ from "./data/fake-blockchain.json";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

/**
 * Setup
 */
const voter = "voter123";
const delegator = "delegator456";
const fakeApi: FakeApi = FakeApi.fromDataset(fakeDataset);
const delegatorWise = new Wise(delegator, fakeApi);
const voterWise = new Wise(delegator, fakeApi);
let syncRunning = true;

/**
 * Testing sequence
 */
const sequence: ([string, () => PromiseLike<void>])[] = [];


sequence.push(["Voter sends voteorder before rules", () => {
    const post: SteemPost = Util.definedOrThrow(_.sample(fakeDataset.posts), new Error("post is undefined"));
    const vo: SendVoteorder = {
        rulesetName: "RulesetOneChangesContent",
        author: post.author,
        permlink: post.permlink,
        weight: 10000
    };

    const skipValidation = true;
    return voterWise.sendVoteorderAsync(delegator, vo, () => {}, skipValidation)
    .then((son: SteemOperationNumber) => {
        expect(son.blockNum).to.be.greaterThan(0);
    });
}]);

sequence.push(["Delegator sets rules for voter", () => {
    const sendRules: SetRules = {
        rulesets: [
            {
                name: "RulesetOneChangesContent",
                rules: [
                    new AuthorsRule(AuthorsRule.Mode.ALLOW, ["noisy"]),
                    new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 2000)
                ]
            },
            {
                name: "RulesetTwoWillBeRemoved",
                rules: [
                    new AuthorsRule(AuthorsRule.Mode.ALLOW, ["perduta"]),
                    new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 2000)
                ]
            }
        ]
    };
    return delegatorWise.sendRulesAsync(voter, sendRules)
    .then((son: SteemOperationNumber) => {
        expect(son.blockNum).to.be.greaterThan(0);
    })
    .then(() => Promise.delay(100))
    .then(() => {
        return voterWise.getRulesetsAsync(delegator, SteemOperationNumber.FUTURE);
    })
    .then((gotRules: SetRules) => {
        expect(gotRules.rulesets).to.be.an("array").with.length(sendRules.rulesets.length);
        sendRules.rulesets.forEach((gotRule, i) => expect(gotRule.name).to.be.equal(sendRules.rulesets[i].name));
    });
}]);

/**
 * Run!
 */
describe("test/index.spec.ts", () => {
    describe("Synchronizer", function() {
        this.timeout(15000);
        let synchronizationPromise: Promise<void>;
        it("Starts synchronization without error", () => {
            const synchronizationPromiseReturner = () => new Promise<void>((resolve, reject) => {
                delegatorWise.runSynchronizerLoop(new SteemOperationNumber(fakeApi.getCurrentBlockNum(), 0, 0), (error: Error | undefined, message: string, moment: SteemOperationNumber): boolean => {
                    console.log(message);
                    if (error) {
                        reject(error);
                        return false;
                    }
                    else {
                        if (!syncRunning) resolve();
                        return syncRunning;
                    }
                });
            });
            synchronizationPromise = synchronizationPromiseReturner();
        });

        it("Synchronizes everything perfectly", () => {
            return Promise.resolve(sequence).mapSeries((item: [string, () => Promise<void>]) => {
                return item[1]();
            });
        });

        it("Stops synchronization properly", () => {
            syncRunning = false;
            return fakeApi.pushFakeBlock().then((son: SteemOperationNumber) => {
                return synchronizationPromise.then(() => {});
            }).then(() => {});
        });

        it("Ends synchronization without error", () => {
            return synchronizationPromise.then(() => {});
        });

    });
});