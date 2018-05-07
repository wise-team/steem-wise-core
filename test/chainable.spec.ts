import { expect } from "chai";
import "mocha";
import { Promise } from "bluebird";

import * as steem from "steem";

import { RawOperation, CustomJsonOperation, VoteOperation } from "../src/blockchain/blockchain-operations-types";
import { AccountHistorySupplier } from "../src/chainable/suppliers/AccountHistorySupplier";
import { Chainable, SmartvotesFilter, ChainableLimiter, SimpleTaker, OperationTypeFilter, OperationNumberFilter } from "../src/chainable/_exports";
import { SteemOperationNumber } from "../src/steem-smartvotes";

describe("test/chainable.spec.ts", () => {
    describe("AccountHistorySupplier", () => {
        describe("AccountHistorySupplier [username = steemprojects1]", () => {
            const steemprojects1Operations: RawOperation [] = [];

            before(function(done) {
                this.timeout(15000);
                new AccountHistorySupplier(steem, "steemprojects1")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new SmartvotesFilter())
                    .chain(new OperationNumberFilter("<", new SteemOperationNumber(22202938, 14, 1))) // ensure no one will be able to manipulate test results by voting
                    .chain(new ChainableLimiter(6))
                    .chain(new SimpleTaker((item: RawOperation): boolean => {
                        steemprojects1Operations.push(item);
                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        done(error);
                        return false;
                    });
                })
                .start(() => done());
            });

            it("Returns exactly 6 operations", () => {
                expect(steemprojects1Operations.length).to.be.equal(6);
            });

            it("Returns only smartvotes operations", () => {
                for (let i = 0; i < steemprojects1Operations.length; i++) {
                    const rawOp = steemprojects1Operations[i];
                    expect(rawOp[1].op[0]).to.be.equal("custom_json");

                    const customJsonOp = rawOp[1].op[1] as CustomJsonOperation;
                    expect(customJsonOp.id).to.be.equal("smartvote");
                }
             });
        });

        describe("AccountHistorySupplier [username = guest123]", () => {
            const realAndVirtual: string [] = [
                "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
                "falf",
                "20180411162422237-diceroll",
                "top-5-cities-in-bangladesh",
                "what-makes-you-you-secret-of-individuality-and-uniqueness"
            ];

            it("Loads both real and virtual operations", function(done) {
                this.timeout(25000);
                new AccountHistorySupplier(steem, "guest123")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationTypeFilter("vote"))
                    .chain(new OperationNumberFilter("<", new SteemOperationNumber(22202938, 14, 1))) // ensure no one will be able to manipulate test results by voting
                    .chain(new SimpleTaker((rawOp: RawOperation): boolean => {
                        const vote: VoteOperation = rawOp[1].op[1] as VoteOperation;

                        const indexInSamples: number = realAndVirtual.indexOf(vote.permlink);
                        if (indexInSamples !== -1) {
                            realAndVirtual.splice(indexInSamples, 1);
                            if (realAndVirtual.length == 0) {
                                return false;
                            }
                        }

                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        console.error(error);
                        done(error);
                        return false;
                    });
                })
                .start(() => {
                    if (realAndVirtual.length > 0) {
                        console.error(new Error("Not all votes were loaded: missing: " + JSON.stringify(realAndVirtual)));
                        done(new Error("Not all votes were loaded: missing: " + JSON.stringify(realAndVirtual)));
                    }
                    else {
                        done();
                        console.log("Done");
                    }
                    /* tslint:disable no-null-keyword */
                });
            });

            const randomVoteOperationsInDescendingTimeOrder: string [] = [
                "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
                "falf",
                "20180411162422237-diceroll",
                "top-5-cities-in-bangladesh",
                "what-makes-you-you-secret-of-individuality-and-uniqueness"
            ];

            it("Loads operations in correct order", function(done) {
                this.timeout(25000);
                new AccountHistorySupplier(steem, "guest123")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationTypeFilter("vote"))
                    .chain(new OperationNumberFilter("<", new SteemOperationNumber(22202938, 14, 1))) // ensure no one will be able to manipulate test results by voting
                    .chain(new SimpleTaker((rawOp: RawOperation): boolean => {
                        const vote: VoteOperation = rawOp[1].op[1] as VoteOperation;

                        const indexInSamples: number = randomVoteOperationsInDescendingTimeOrder.indexOf(vote.permlink);
                        if (indexInSamples !== -1) {
                            if (indexInSamples !== 0) {
                                const error = new Error("Votes returned in wrogn order. Received " + vote.permlink + ", sholudReceive: " + randomVoteOperationsInDescendingTimeOrder[0]);
                                console.error(error);
                                done(error);
                                return false;
                            }
                            else {
                                randomVoteOperationsInDescendingTimeOrder.shift();
                                if (randomVoteOperationsInDescendingTimeOrder.length == 0) {
                                    return false;
                                }
                            }
                        }

                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        console.error(error);
                        done(error);
                        return false;
                    });
                })
                .start(() => {
                    if (randomVoteOperationsInDescendingTimeOrder.length > 0) {
                        done(new Error("Not all votes were loaded: missing: " + JSON.stringify(randomVoteOperationsInDescendingTimeOrder)));
                    }
                    else done();
                });
            });
        });
    });

    describe("OperationNumberFilter", () => {
        it("returns only operations with number < (block=22202938, tx=14, op=1)", function(done) {
            this.timeout(25000);
            new Promise((resolve, reject) => {
                new AccountHistorySupplier(steem, "guest123")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationNumberFilter("<", new SteemOperationNumber(22202938, 14, 1)))
                    .chain(new SimpleTaker((rawOp: RawOperation): boolean => {
                        if (rawOp[1].block > 22202938) {
                            reject(new Error("Operation outside of scope was passed: " + SteemOperationNumber.fromOperation(rawOp).toString()));
                            return false;
                        }
                        else if (rawOp[1].block == 22202938 && rawOp[1].trx_in_block > 14) {
                            reject(new Error("Operation outside of scope was passed: " +  + SteemOperationNumber.fromOperation(rawOp).toString()));
                            return false;
                        }
                        else if (rawOp[1].block == 22202938 && rawOp[1].trx_in_block == 14 && rawOp[1].op_in_trx >= 1) {
                            reject(new Error("Operation outside of scope was passed: " + SteemOperationNumber.fromOperation(rawOp).toString()));
                            return false;
                        }

                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        reject(error);
                        return false;
                    });
                })
                .start(() => {
                    resolve();
                });
            })
            .then(() => done())
            .catch((error: Error) => done(error));
        });
    });
});