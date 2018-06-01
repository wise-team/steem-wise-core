// TODO test Synchronizator with FakeApi

import { expect, assert } from "chai";
import * as Bluebird from "bluebird";
import * as _ from "lodash";
import "mocha";

import { Wise, SteemOperationNumber, SendVoteorder } from "../src/wise";
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
const sequence: ([string, () => Bluebird<void>])[] = [];

sequence.push(["delegator starts synchronization", () => {
    return new Bluebird((resolve, reject) => {
        delegatorWise.runSynchronizerLoop(new SteemOperationNumber(0, 0, 0), (error: Error | undefined, message: string, moment: SteemOperationNumber): boolean => {
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
}]);

sequence.push(["voter sends voteorder before rules", () => {
    return new Bluebird<SteemOperationNumber>((resolve, reject) => {
        const skipValidation = true;
        const post: SteemPost = Util.definedOrThrow(_.sample(fakeDataset.posts), new Error("post is undefined"));
        const vo: SendVoteorder = {
            rulesetName: "",
            author: post.author,
            permlink: post.permlink,
            weight: 10000
        };
        voterWise.sendVoteorder(delegator, vo, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
            if (error) reject(error);
            else resolve(result);
        }, () => {}, skipValidation);
    })
    .then((son: SteemOperationNumber) => {
        expect(son.blockNum).to.be.greaterThan(0);
    });
}]);

sequence.push(["Stop sync", () => {
    return new Bluebird((resolve, reject) => {
        syncRunning = false;
        resolve();
    });
}]);

/**
 * Run!
 */
describe("test/index.spec.ts", () => {
    describe("Synchronizer", function() {
        it("Synchronizes everything perfectly", () => {
            return Bluebird.resolve(sequence).mapSeries((item: [string, () => Bluebird<void>]) => {
                console.log(item[0] + ":>");
                item[1]();
            });
        });
    });
});