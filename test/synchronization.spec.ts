// TODO test Synchronizator with FakeApi

import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";

import { Wise, SteemOperationNumber, SendVoteorder } from "../src/wise";
import { FakeApi } from "./util/FakeApi";
import { SteemPost } from "../src/blockchain/SteemPost";

/**
 * Setup
 */
const voter = "voter123";
const delegator = "delegator456";
const delegatorWise = new Wise(delegator, new FakeApi());
const voterWise = new Wise(delegator, new FakeApi());
let syncRunning = true;

/**
 * Fake posts
 */
const posts: SteemPost [] = [
    {
        id: 1,
        author: "a1",
        permlink: "p1",
        category: "cat1",
        title: "title1",
        body: "body1",
        json_metadata: JSON.stringify({tags: ["tag1", "tag2"]}),
        last_update: "",
        created: "",
        active: "",
        last_payout: ""
    }
];

/**
 * Testing sequence
 */
const sequence: ([string, () => Promise<void>])[] = [];

sequence.push(["delegator starts synchronization", () => {
    return new Promise((resolve, reject) => {
        delegatorWise.runSynchronizerLoop(new SteemOperationNumber(0, 0, 0), (error: Error | undefined, message: string, moment: SteemOperationNumber): boolean => {
            if (error) {
                reject();
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
    return new Promise<SteemOperationNumber>((resolve, reject) => {
        const skipValidation = true;
        const vo: SendVoteorder = {
            rulesetName: "",
            author: posts[0].author,
            permlink: posts[0].permlink,
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
    return new Promise((resolve, reject) => {
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
            return Promise.resolve(sequence).mapSeries((item: [string, () => Promise<void>]) => item[1]());
        });
    });
});