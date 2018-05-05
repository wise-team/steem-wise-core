import { expect } from "chai";
import "mocha";

import * as steem from "steem";

import { RawOperation, CustomJsonOperation, VoteOperation } from "../src/types/blockchain-operations-types";
import { AccountHistorySupplier } from "../src/chainable/suppliers/AccountHistorySupplier";
import { Chainable, SmartvotesFilter, ChainableLimiter, SimpleTaker, OperationTypeFilter } from "../src/chainable/_exports";

describe("test/iterator.spec.ts", () => {
    describe("AccountHistorySupplier", () => {
        describe("AccountHistorySupplier [username = steemprojects1]", () => {
            const steemprojects1Operations: RawOperation [] = [];

            before(function(done) {
                this.timeout(15000);
                new AccountHistorySupplier(steem, "steemprojects1")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new SmartvotesFilter())
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
            const randomVoteOperationsInDescendingTimeOrder: string [] = [
                "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
                "falf",
                "20180411162422237-diceroll",
                "top-5-cities-in-bangladesh",
                "what-makes-you-you-secret-of-individuality-and-uniqueness"
            ];
            let allDone = false;

            it("Loads operations in correct order", function(done) {
                this.timeout(15000);

                new AccountHistorySupplier(steem, "guest123")
                .branch((historySupplier) => {
                    historySupplier
                    .chain(new OperationTypeFilter("vote"))
                    .chain(new SimpleTaker((rawOp: RawOperation): boolean => {
                        const vote: VoteOperation = rawOp[1].op[1] as VoteOperation;

                        const indexInSamples: number = randomVoteOperationsInDescendingTimeOrder.indexOf(vote.permlink);
                        if (indexInSamples !== -1) {
                            if (indexInSamples !== 0) {
                                done(new Error("Votes returned in wrogn order"));
                                return false;
                            }
                            else {
                                randomVoteOperationsInDescendingTimeOrder.shift();
                                if (randomVoteOperationsInDescendingTimeOrder.length == 0) {
                                    allDone = true;
                                    done();
                                    return false;
                                }
                            }
                        }

                        return true;
                    }))
                    .catch((error: Error): boolean => {
                        done(error);
                        return false;
                    });
                })
                .start(() => {
                    if (randomVoteOperationsInDescendingTimeOrder.length > 0) {
                        done(new Error("Not all votes were loaded"));
                    }
                });
            });
        });
    });
});