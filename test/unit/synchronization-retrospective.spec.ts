// 3rd party imports
/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import { expect, assert } from "chai";
import * as _ from "lodash";
import "mocha";
import { Log } from "../../src/log/Log";

// wise imports
import { Wise, SteemOperationNumber, Api, SingleDaemon } from "../../src/wise";
import { FakeApi } from "../../src/api/FakeApi";


/* PREPARE TESTING DATASETS */
import { FakeWiseFactory } from "../util/FakeWiseFactory";

BluebirdPromise.onPossiblyUnhandledRejection(function(error) {
    throw error;
});

/**
 * Setup
 */
const delegator = "noisy";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi: FakeApi = FakeApi.fromDataset(Wise.constructDefaultProtocol(), fakeDataset);
fakeApi.setFakeDelayMs(0);
const delegatorWise = new Wise(delegator, fakeApi as object as Api);



/**
 * Run!
 */
let synchronizer: SingleDaemon;

describe("test/unit/synchronization-retrospective.spec.ts", () => {
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
            const synchronizationPromiseReturner = async () => await new BluebirdPromise<void>((resolve, reject) => {
                synchronizer = delegatorWise.startDaemon(new SteemOperationNumber(fromBlock, 0, 0),
                    (error: Error | undefined, event: SingleDaemon.Event): void => {
                    if (event.type === SingleDaemon.EventType.SynchronizationStop) {
                        resolve();
                    }
                    else if (event.type === SingleDaemon.EventType.VoteorderPassed) {
                        confirmations.push({ voteorderTx: event.voteorderTxId, accepted: true });
                    }
                    else if (event.type === SingleDaemon.EventType.VoteorderRejected) {
                        confirmations.push({ voteorderTx: event.voteorderTxId, accepted: false });
                    }
                    else if (event.type === SingleDaemon.EventType.EndBlockProcessing) {
                        if (event.blockNum % 5000 === 0) Log.log().json(Log.level.info, event);
                        if (event.blockNum === toBlock) {
                            Log.log().info("Last block. Stopping synchronization");
                            synchronizer.stop();
                            fakeApi.pushFakeBlock().then((son: SteemOperationNumber) => {
                                return synchronizationPromise.then(() => {});
                            }).then(() => {});
                        }
                    }
                    if (event.type !== SingleDaemon.EventType.StartBlockProcessing
                    && event.type !== SingleDaemon.EventType.EndBlockProcessing) Log.log().json(Log.level.info, event);

                    if (error) {
                        reject(error);
                        synchronizer.stop();
                    }
                });
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