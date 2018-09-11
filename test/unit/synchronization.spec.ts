// 3rd party imports
import { expect, assert } from "chai";
import * as Promise from "bluebird";
import * as _ from "lodash";
import "mocha";
import { Log } from "../../src/util/log"; const log = Log.getLogger();

// wise imports
import { Wise, SteemOperationNumber, SendVoteorder, SetRules, AuthorsRule, WeightRule, TagsRule, ValidationException, Api } from "../../src/wise";
import { SteemPost } from "../../src/blockchain/SteemPost";
import { FakeApi } from "../../src/api/FakeApi";
import { Util } from "../../src/util/util";
import { Synchronizer } from "../../src/Synchronizer";
import { isConfirmVote, ConfirmVote } from "../../src/protocol/ConfirmVote";


/* PREPARE TESTING DATASETS */
import { EffectuatedWiseOperation } from "../../src/protocol/EffectuatedWiseOperation";
import { FakeWiseFactory } from "../util/FakeWiseFactory";

Promise.onPossiblyUnhandledRejection(function(error) {
    throw error;
});

/**
 * Setup
 */
const voter = "voter123";
const delegator = "delegator456";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi: FakeApi = FakeApi.fromDataset(fakeDataset);
const delegatorWise = new Wise(delegator, fakeApi as object as Api);
const voterWise = new Wise(voter, fakeApi as object as Api);



/**
 * Run!
 */
let synchronizer: Synchronizer;

describe("test/unit/synchronization.spec.ts", () => {
    describe("Synchronizer", function() {
        this.timeout(2000);
        let synchronizationPromise: Promise<void>;
        it("Starts synchronization without error", () => {
            const synchronizationPromiseReturner = () => new Promise<void>((resolve, reject) => {
                synchronizer = delegatorWise.runSynchronizerLoop(new SteemOperationNumber(fakeApi.getCurrentBlockNum(), 0, 0),
                    (error: Error | undefined, event: Synchronizer.Event): void => {
                    if (event.type === Synchronizer.EventType.SynchronizationStop) {
                        resolve();
                    }
                    // log.info(event);

                    if (error) {
                        reject(error);
                        synchronizer.stop();
                    }
                });
                synchronizer.setTimeout(200);
            });
            synchronizationPromise = synchronizationPromiseReturner();
        });

        it("rejects voteorder sent before rules", () => {
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
            })
            .then(() => Promise.delay(80))
            .then(() => {
                const lastTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
                const handleResult = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastTrx));
                expect(handleResult).to.be.an("array").with.length(1);
                expect(isConfirmVote(handleResult[0].command)).to.be.true;
                expect((handleResult[0].command as ConfirmVote).accepted).to.be.false;
            });
        });

        it("Delegator sets rules for voter", () => {
            const sendRules: SetRules = {
                rulesets: [
                    {
                        name: "RulesetOneChangesContent",
                        rules: [
                            new AuthorsRule(AuthorsRule.Mode.ALLOW, ["noisy"]),
                            new WeightRule(0, 2000)
                        ]
                    },
                    {
                        name: "RulesetTwoWillBeRemoved",
                        rules: [
                            new AuthorsRule(AuthorsRule.Mode.ALLOW, ["perduta"]),
                            new WeightRule(0, 2000)
                        ]
                    }
                ]
            };
            return delegatorWise.sendRulesAsync(voter, sendRules)
            .then((son: SteemOperationNumber) => {
                expect(son.blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(50))
            .then(() => {
                return voterWise.getRulesetsAsync(delegator, SteemOperationNumber.FUTURE);
            })
            .then((gotRules: SetRules) => {
                expect(gotRules.rulesets).to.be.an("array").with.length(sendRules.rulesets.length);
                sendRules.rulesets.forEach((gotRule, i) => expect(gotRule.name).to.be.equal(sendRules.rulesets[i].name));
            });
        });

        const validVoteorders1: SendVoteorder [] = [
            {
                rulesetName: "RulesetOneChangesContent",
                author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                weight: 1
            },
            {
                rulesetName: "RulesetTwoWillBeRemoved",
                author: "perduta",
                permlink: "do-you-feel-connected-to-your-home-country",
                weight: 1
            }
        ];
        validVoteorders1.forEach((voteorder: SendVoteorder) => it("Voter sends valid voteorder (ruleset=" + voteorder.rulesetName + ") and delegator passes them", () => {
            return voterWise.sendVoteorderAsync(delegator, voteorder)
            .then((moment: SteemOperationNumber) => {
                expect(moment.blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(100))
            .then(() => {
                const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
                const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
                const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
                expect(isConfirmVote(lastHandledOp.command), "isConfirmVote").to.be.true;
                expect((lastHandledOp.command as ConfirmVote).accepted, "accepted").to.be.true;
            });
        }));

        const invalidVoteorders1: SendVoteorder [] = [
            {
                rulesetName: "RulesetOneChangesContent",
                author: "perduta",
                permlink: "do-you-feel-connected-to-your-home-country",
                weight: 1
            },
            {
                rulesetName: "RulesetTwoWillBeRemoved",
                author: "noisy",
                permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                weight: 1
            }
        ];

        invalidVoteorders1.forEach((voteorder: SendVoteorder) => it("Voter sends invalid voteorder (ruleset=" + voteorder.rulesetName + ") and delegator rejects them", () => {
            const skipValidation = true;
            return voterWise.sendVoteorderAsync(delegator, voteorder, () => {}, skipValidation)
            .then((moment: SteemOperationNumber) => expect(moment.blockNum).to.be.greaterThan(0))
            .then(() => Promise.delay(100))
            .then(() => {
                const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
                const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
                const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
                expect(isConfirmVote(lastHandledOp.command), "last pushed op is confirm vote").to.be.true;
                expect((lastHandledOp.command as ConfirmVote).accepted, "last pushed op is accepted confirm vote").to.be.false;
            });
        }));

        it("Delegator changes rules", () => {
            const sendRules: SetRules = {
                rulesets: [
                    {
                        name: "RulesetOneChangesContent",
                        rules: [
                            new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects"]),
                            new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy"]),
                            new WeightRule(0, 10)
                        ]
                    }
                ]
            };
            return delegatorWise.sendRulesAsync(voter, sendRules)
            .then((son: SteemOperationNumber) => {
                expect(son.blockNum).to.be.greaterThan(0);
            })
            .then(() => Promise.delay(50))
            .then(() => {
                return voterWise.getRulesetsAsync(delegator, SteemOperationNumber.FUTURE);
            })
            .then((gotRules: SetRules) => {
                expect(gotRules.rulesets).to.be.an("array").with.length(sendRules.rulesets.length);
                sendRules.rulesets.forEach((gotRule, i) => expect(gotRule.name).to.be.equal(sendRules.rulesets[i].name));
            });
        });

        const previouslyValidNowInvalidVoteorders = validVoteorders1;
        previouslyValidNowInvalidVoteorders.forEach((voteorder: SendVoteorder) => it("Voter sends previously valid (but now invalid) voteorder (ruleset= " + voteorder.rulesetName + ") and delegator rejects them", () => {
            const skipValidation = true;
            return voterWise.sendVoteorderAsync(delegator, voteorder, () => {}, skipValidation)
            .then((moment: SteemOperationNumber) => expect(moment.blockNum).to.be.greaterThan(0))
            .then(() => Promise.delay(100))
            .then(() => {
                const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
                const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
                const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
                expect(isConfirmVote(lastHandledOp.command)).to.be.true;
                expect((lastHandledOp.command as ConfirmVote).accepted).to.be.false;
            });
        }));

        const previouslyInalidNowValidVoteorders: SendVoteorder [] = [
            {
                rulesetName: "RulesetOneChangesContent",
                author: "pojan",
                permlink: "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad",
                weight: 1
            }
        ];
        previouslyInalidNowValidVoteorders.forEach((voteorder: SendVoteorder) => it("Voter sends now valid (but previously invalid) voteorder (rulesetName= " + voteorder.rulesetName + ") and delegator passes them", () => {
            return voterWise.sendVoteorderAsync(delegator, voteorder)
            .then((moment: SteemOperationNumber) => expect(moment.blockNum).to.be.greaterThan(0))
            .then(() => Promise.delay(100))
            .then(() => {
                const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
                const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
                const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
                expect(isConfirmVote(lastHandledOp.command)).to.be.true;
                expect((lastHandledOp.command as ConfirmVote).accepted).to.be.true;
            });
        }));

        it("Delegator rejects nonexistent post with negative confirmation but without error", () => {
            const voteorder: SendVoteorder = {
                rulesetName: "RulesetOneChangesContent",
                author: "perduta",
                permlink: "nonexistentPost-" + Date.now(),
                weight: 5
            };

            const skipValidation = true;
            return voterWise.sendVoteorderAsync(delegator, voteorder, () => {}, skipValidation)
            .then((moment: SteemOperationNumber) => expect(moment.blockNum).to.be.greaterThan(0))
            .then(() => Promise.delay(50), (e: Error) => {
                if ((e as ValidationException).validationException) throw new Error("ValidationException present at send");
                else throw e;
            })
            .then(() => {
                const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
                const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
                const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
                expect(isConfirmVote(lastHandledOp.command)).to.be.true;
                expect((lastHandledOp.command as ConfirmVote).accepted).to.be.false;
            }, (e: Error) => {
                if ((e as ValidationException).validationException) throw new Error("Should not throw ValidationException, but pass it");
                else throw e;
            });
        });

        it("Stops synchronization properly", () => {
            synchronizer.stop();
            return fakeApi.pushFakeBlock().then((son: SteemOperationNumber) => {
                return synchronizationPromise.then(() => {});
            }).then(() => {});
        });

        it("Ends synchronization without error", () => {
            return synchronizationPromise.then(() => {});
        });

    });
});