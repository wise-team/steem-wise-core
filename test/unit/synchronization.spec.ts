// 3rd party imports
/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import { expect, assert } from "chai";
import * as _ from "lodash";
import * as steem from "steem";
import "mocha";
import { Log } from "../../src/log/log";

// wise imports
import { Wise, SteemOperationNumber, SendVoteorder, SetRules, AuthorsRule, WeightRule, TagsRule, ValidationException, Api, Ruleset } from "../../src/wise";
import { FakeApi } from "../../src/api/FakeApi";
import { Util } from "../../src/util/util";
import { Synchronizer } from "../../src/Synchronizer";
import { ConfirmVote } from "../../src/protocol/ConfirmVote";


/* PREPARE TESTING DATASETS */
import { EffectuatedWiseOperation } from "../../src/protocol/EffectuatedWiseOperation";
import { FakeWiseFactory } from "../util/FakeWiseFactory";
import { SynchronizerTestToolkit } from "./util/SynchronizerTestToolkit";

BluebirdPromise.onPossiblyUnhandledRejection(function(error) {
    throw error;
});

/**
 * Run!
 */
describe("test/unit/synchronization.spec.ts", () => {
    describe("Synchronizer", function() {
        this.timeout(2000);

        const voter = "voter123";
        const delegator = "delegator456";
        let fakeDataset: FakeApi.Dataset;
        let fakeApi: FakeApi;
        let delegatorWise: Wise;
        let voterWise: Wise;
        let synchronizerToolkit: SynchronizerTestToolkit;
        const nowTime = new Date(Date.now());

        before(function () {
            fakeDataset = FakeWiseFactory.loadDataset();
            fakeApi = FakeApi.fromDataset(Wise.constructDefaultProtocol(), fakeDataset);
            delegatorWise = new Wise(delegator, fakeApi as object as Api);
            voterWise = new Wise(voter, fakeApi as object as Api);
            synchronizerToolkit = new SynchronizerTestToolkit(delegatorWise);
        });

        it("Starts synchronization without error", () => {
            synchronizerToolkit.start((fakeApi as any as FakeApi).getCurrentBlockNum());
        });

        it("rejects voteorder sent before rules", async () => {
            const post: steem.SteemPost = Util.definedOrThrow(_.sample(fakeDataset.posts), new Error("post is undefined"));
            const vo: SendVoteorder = {
                rulesetName: "RulesetOneChangesContent",
                author: post.author,
                permlink: post.permlink,
                weight: 10000
            };

            const skipValidation = true;
            const moment = await voterWise.sendVoteorder(delegator, vo, () => {}, skipValidation);
            expect(moment.blockNum).to.be.greaterThan(0);
            await BluebirdPromise.delay(80);

            const lastTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
            const handleResult = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastTrx));
            expect(handleResult).to.be.an("array").with.length(1);
            expect(ConfirmVote.isConfirmVote(handleResult[0].command)).to.be.true;
            expect((handleResult[0].command as ConfirmVote).accepted).to.be.false;
        });

        it("Delegator sets rules for voter", async () => {
            const sendRulesets: Ruleset [] = [
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
            ];
            const son = await delegatorWise.uploadRulesetsForVoter(voter, sendRulesets);
            expect(son.blockNum).to.be.greaterThan(0);
            await BluebirdPromise.delay(50);
            const gotRulesets: Ruleset [] = await voterWise.downloadRulesetsForVoter(delegator, voter);

            expect(gotRulesets).to.be.an("array").with.length(sendRulesets.length);
            sendRulesets.forEach((gotRule, i) => expect(gotRule.name).to.be.equal(sendRulesets[i].name));
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
        validVoteorders1.forEach((voteorder: SendVoteorder) => it("Voter sends valid voteorder (ruleset=" + voteorder.rulesetName + ") and delegator passes them", async () => {
            const moment = await voterWise.sendVoteorder(delegator, voteorder);
            expect(moment.blockNum).to.be.greaterThan(0);
            await BluebirdPromise.delay(100);
            const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
            const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
            const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
            expect(ConfirmVote.isConfirmVote(lastHandledOp.command), "isConfirmVote").to.be.true;
            expect((lastHandledOp.command as ConfirmVote).accepted, "accepted").to.be.true;
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

        invalidVoteorders1.forEach((voteorder: SendVoteorder) => it("Voter sends invalid voteorder (ruleset=" + voteorder.rulesetName + ") and delegator rejects them", async () => {
            const skipValidation = true;
            const moment = await voterWise.sendVoteorder(delegator, voteorder, () => {}, skipValidation);
            expect(moment.blockNum).to.be.greaterThan(0);
            await BluebirdPromise.delay(100);
            const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
            const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
            const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
            expect(ConfirmVote.isConfirmVote(lastHandledOp.command), "last pushed op is confirm vote").to.be.true;
            expect((lastHandledOp.command as ConfirmVote).accepted, "last pushed op is accepted confirm vote").to.be.false;
        }));

        it("Delegator changes rules", async () => {
            const sendRulesets: Ruleset [] = [
                {
                    name: "RulesetOneChangesContent",
                    rules: [
                        new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects"]),
                        new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy"]),
                        new WeightRule(0, 10)
                    ]
                }
            ];
            const son = await delegatorWise.uploadRulesetsForVoter(voter, sendRulesets);
            expect(son.blockNum).to.be.greaterThan(0);
            await BluebirdPromise.delay(50);
            const gotRulesets: Ruleset [] = await voterWise.downloadRulesetsForVoter(delegator, voter);
            expect(gotRulesets).to.be.an("array").with.length(sendRulesets.length);
            sendRulesets.forEach((gotRule, i) => expect(gotRule.name).to.be.equal(sendRulesets[i].name));
        });

        const previouslyValidNowInvalidVoteorders = validVoteorders1;
        previouslyValidNowInvalidVoteorders.forEach((voteorder: SendVoteorder) => it("Voter sends previously valid (but now invalid) voteorder (ruleset= " + voteorder.rulesetName + ") and delegator rejects them", async () => {
            const skipValidation = true;
            const moment = await voterWise.sendVoteorder(delegator, voteorder, () => {}, skipValidation);
            expect(moment.blockNum).to.be.greaterThan(0);
            await BluebirdPromise.delay(100);

            const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
            const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
            const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
            expect(ConfirmVote.isConfirmVote(lastHandledOp.command)).to.be.true;
            expect((lastHandledOp.command as ConfirmVote).accepted).to.be.false;
        }));

        const previouslyInalidNowValidVoteorders: SendVoteorder [] = [
            {
                rulesetName: "RulesetOneChangesContent",
                author: "pojan",
                permlink: "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad",
                weight: 1
            }
        ];
        previouslyInalidNowValidVoteorders.forEach((voteorder: SendVoteorder) => it("Voter sends now valid (but previously invalid) voteorder (rulesetName= " + voteorder.rulesetName + ") and delegator passes them", async () => {
            const moment = await voterWise.sendVoteorder(delegator, voteorder);
            expect(moment.blockNum).to.be.greaterThan(0);
            await BluebirdPromise.delay(100);
            const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
            const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
            const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
            expect(ConfirmVote.isConfirmVote(lastHandledOp.command)).to.be.true;
            expect((lastHandledOp.command as ConfirmVote).accepted).to.be.true;
        }));

        it("Delegator rejects nonexistent post with negative confirmation but without error", async () => {
            const voteorder: SendVoteorder = {
                rulesetName: "RulesetOneChangesContent",
                author: "perduta",
                permlink: "nonexistentPost-" + Date.now(),
                weight: 5
            };

            try {
                const skipValidation = true;
                const moment = await voterWise.sendVoteorder(delegator, voteorder, () => {}, skipValidation);
                expect(moment.blockNum).to.be.greaterThan(0);
                await BluebirdPromise.delay(120);

                const lastPushedTrx = Util.definedOrThrow(_.last(fakeApi.getPushedTransactions()));
                const handledOps: EffectuatedWiseOperation [] = Util.definedOrThrow(delegatorWise.getProtocol().handleOrReject(lastPushedTrx));
                const lastHandledOp = Util.definedOrThrow(_.last(handledOps));
                expect(ConfirmVote.isConfirmVote(lastHandledOp.command)).to.be.true;
                expect((lastHandledOp.command as ConfirmVote).accepted).to.be.false;
            }
            catch (e) {
                if ((e as ValidationException).validationException) throw new Error("Should not throw ValidationException, but pass it");
                else throw e;
            }
        });

        it("Stops synchronization properly", async () => {
            synchronizerToolkit.getSynchronizer().stop();
            await (fakeApi as any as FakeApi).pushFakeBlock();
            await synchronizerToolkit.getSynchronizerPromise().then(() => {});
        });

        it("Ends synchronization without error", async () => {
            await synchronizerToolkit.getSynchronizerPromise().then(() => {});
        });
    });
});