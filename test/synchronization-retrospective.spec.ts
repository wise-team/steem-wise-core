// 3rd party imports
import { expect, assert } from "chai";
import * as Promise from "bluebird";
import * as _ from "lodash";
import "mocha";
import { Log } from "../src/util/log"; const log = Log.getLogger(); Log.setLevel("info");

// wise imports
import { Wise, SteemOperationNumber, SendVoteorder, SetRules, AuthorsRule, WeightRule, TagsRule, ValidationException, Api, DirectBlockchainApi } from "../src/wise";
import { SteemPost } from "../src/blockchain/SteemPost";
import { FakeApi } from "../src/api/FakeApi";
import { Util } from "../src/util/util";
import { Synchronizer } from "../src/Synchronizer";
import { isConfirmVote, ConfirmVote } from "../src/protocol/ConfirmVote";


/* PREPARE TESTING DATASETS */
import { EffectuatedSmartvotesOperation } from "../src/protocol/EffectuatedSmartvotesOperation";
import { FakeWiseFactory } from "./util/FakeWiseFactory";

Promise.onPossiblyUnhandledRejection(function(error) {
    throw error;
});

/**
 * Setup
 */
const delegator = "noisy";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi: FakeApi = FakeApi.fromDataset(fakeDataset);
fakeApi.setFakeDelayMs(0);
const delegatorWise = new Wise(delegator, fakeApi as object as Api);



/**
 * Run!
 */
let synchronizer: Synchronizer;

describe("test/synchronization-retrospective.spec.ts", () => {
    const cases: { voteorderTx: string; shouldAccept: boolean; } [] = [
        { voteorderTx: "1dcf2948d9f5efb3219ce04f6b782dc08076e7bf", shouldAccept: true },
    ];
    const fromBlock: number = 24699500;
    const toBlock: number = 24699600;

    const confirmations: { voteorderTx: string; accepted: boolean; } [] = [];

    describe("Synchronizer - retrospective test (based on real blockchain data)", function() {
        this.timeout(3000);
        let synchronizationPromise: Promise<void>;
        it("Starts synchronization without error", () => {
            const synchronizationPromiseReturner = () => new Promise<void>((resolve, reject) => {
                synchronizer = delegatorWise.runSynchronizerLoop(new SteemOperationNumber(fromBlock, 0, 0),
                    (error: Error | undefined, event: Synchronizer.Event): void => {
                    if (event.type === Synchronizer.EventType.SynchronizationStop) {
                        resolve();
                    }
                    else if (event.type === Synchronizer.EventType.VoteorderPassed) {
                        confirmations.push({ voteorderTx: event.voteorderTxId, accepted: true });
                    }
                    else if (event.type === Synchronizer.EventType.VoteorderRejected) {
                        confirmations.push({ voteorderTx: event.voteorderTxId, accepted: false });
                    }
                    else if (event.type === Synchronizer.EventType.EndBlockProcessing) {
                        if (event.blockNum % 5000 === 0) log.info(event);
                        if (event.blockNum === toBlock) {
                            log.info("Last block. Stopping synchronization");
                            synchronizer.stop();
                            fakeApi.pushFakeBlock().then((son: SteemOperationNumber) => {
                                return synchronizationPromise.then(() => {});
                            }).then(() => {});
                        }
                    }
                    if (event.type !== Synchronizer.EventType.StartBlockProcessing
                    && event.type !== Synchronizer.EventType.EndBlockProcessing) log.info(event);

                    if (error) {
                        reject(error);
                        synchronizer.stop();
                    }
                });
                synchronizer.setTimeout(200);
            });
            return synchronizationPromise = synchronizationPromiseReturner();
        });

        it("Confirmations match cases", () => {
            cases.forEach(case_ => {
                const matching = confirmations.filter(c => c.voteorderTx === case_.voteorderTx);
                expect(matching).to.be.an("array").with.length(1);
                expect(matching[0].voteorderTx).to.be.equal(case_.voteorderTx);
                expect(matching[0].accepted, "voteorder " + matching[0].voteorderTx + " accepted").to.be.equal(case_.shouldAccept);
            });
        });

        it("Ends synchronization without error", () => {
            return synchronizationPromise.then(() => {});
        });

    });
});