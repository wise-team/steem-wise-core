// 3rd party imports
import { assert, expect } from "chai";
import "mocha";
import * as _ from "lodash";
import * as steem from "steem";
import { Log } from "../../src/log/log";

// wise imports
import { Wise, EffectuatedSetRules } from "../../src/wise";
import { Api } from "../../src/api/Api";
import { DirectBlockchainApi } from "../../src/api/directblockchain/DirectBlockchainApi";
import { WiseSQLApi } from "../../src/api/sql/WiseSQLApi";
import { FakeApi } from "../../src/api/FakeApi";
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";
import { SetRules } from "../../src/protocol/SetRules";
import { WeightRule } from "../../src/rules/WeightRule";
import { Rule } from "../../src/rules/Rule";
import { EffectuatedWiseOperation } from "../../src/protocol/EffectuatedWiseOperation";
import { NotFoundException } from "../../src/util/NotFoundException";


/* PREPARE TESTING DATASETS */
import * as v1TestingSequence from "../data/protocol-v1-testing-sequence";
import { FakeWiseFactory } from "../util/FakeWiseFactory";
import { VoteOperation } from "../../src/blockchain/VoteOperation";
import { ConfirmVoteBoundWithVote } from "../../src/protocol/ConfirmVoteBoundWithVote";
import { ConfirmVote } from "../../src/protocol/ConfirmVote";

/* CONFIG */
const username = "guest123";
const postingWif = "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg";
const wiseSqlEndpoint = /*§ §*/ "https://sql.wise.vote/" /*§ ' "' + d(data.config.sql.url.production) + '" ' §.*/;

describe("test/integration/api.spec.ts", function () {
    this.timeout(60000);
    const DEFAULT_STEEM_API_ENDPOINT_URL = /*§ §*/ "https://anyx.io" /*§ ' "' + data.config.steem.defaultApiUrl + '" ' §.*/;

    const apis: Api [] = [
        new DirectBlockchainApi(Wise.constructDefaultProtocol(), postingWif, { url: DEFAULT_STEEM_API_ENDPOINT_URL }),
        FakeWiseFactory.buildFakeApi(),
        new WiseSQLApi(wiseSqlEndpoint, Wise.constructDefaultProtocol(),
            new DirectBlockchainApi(Wise.constructDefaultProtocol(), postingWif, { url: DEFAULT_STEEM_API_ENDPOINT_URL }))
    ];

    apis.forEach((api: Api) => describe("api " + api.name(), () => {
        const wise = new Wise(username, api);
        /**
         * Test post loading for each api
         */
        describe("#loadPost", () => {
            it("loads correct post", async () => {
                const post: steem.SteemPost = await api.loadPost("noisy", "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that");
                expect(post.author).to.be.equal("noisy");
                expect(post.permlink).to.be.equal("dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that");
                assert(post.body.indexOf("Declining a payout from a comment was possible even earlier, however it was always difficult to do that without some programming skills.") !== -1);

                expect((JSON.parse(post.json_metadata) as steem.SteemPost.JSONMetadata).tags)
                    .to.be.an("array").that.includes("voting").and.includes("steem").and.includes("steemit")
                    .and.has.length(3);
            });

            it("throws NotFoundException on nonexistent post", async () => {
                try {
                    const result = await api.loadPost("noisy", "nonexistent-permlink-" + Date.now());
                    throw new Error("Should fail on nonexistent post. Got some data instead.");
                }
                catch (e) {
                    if (!(e as NotFoundException).notFoundException) throw e;
                }
            });
        });

        /**
         * Test loading rulesets
         */
        describe("#loadRulesets (for delegator and voter)", () => {
            it("returns empty list if no rulesets are set (does not fall silently)", async () => {
                const delegator = "steemprojects2";
                const voter = "steemprojects1";
                const moment = new SteemOperationNumber(22144254, 42, 0); // before this moment @steemprojects2 has no rules for anyone

                const r = await api.loadRulesets({ delegator: delegator, voter: voter }, moment);
                expect(r).to.be.an("array").that.has.length(0);
            });

            it("loads proper rules (v1)", async () => {
                const delegator = v1TestingSequence.stage1_0_RulesetsUsername;
                const voter = v1TestingSequence.stage1_0_Rulesets.rulesets[0].voter;
                const moment = v1TestingSequence.stage1_2_SyncConfirmationMoment;

                const esrArray = await api.loadRulesets({ delegator: delegator, voter: voter }, moment);
                expect(esrArray).to.be.an("array").with.length(1);
                const r: SetRules = esrArray[0];
                expect(r.rulesets, "rulesets").to.be.an("array").with.length(v1TestingSequence.stage1_0_Rulesets.rulesets.length);
                for (let i = 0; i < v1TestingSequence.stage1_0_Rulesets.rulesets.length; i++) {
                    const expectedRuleset = v1TestingSequence.stage1_0_Rulesets.rulesets[i];
                    const receivedRuleset = r.rulesets[i];
                    expect(receivedRuleset.name).to.equal(expectedRuleset.name);
                    receivedRuleset.rules.forEach(rule => {
                        if (rule.type() == Rule.Type.Weight) {
                            expect((rule as WeightRule).max).to.be.equal(1);
                            expect((rule as WeightRule).min).to.be.equal(0);
                        }
                    });
                }
            });

            it("returns no rules for non existing delegator", async () => {
                const delegator = "nonexistent-" + Date.now();
                const voter = v1TestingSequence.stage1_0_Rulesets.rulesets[0].voter;
                const moment = v1TestingSequence.stage1_2_SyncConfirmationMoment;

                const r = await api.loadRulesets({ delegator: delegator, voter: voter }, moment);
                expect(r).to.be.an("array").with.length(0);
            });

            it("returns no rules for non existing voter", async () => {
                const delegator = v1TestingSequence.stage1_0_RulesetsUsername;
                const voter = "nonexistent-" + Date.now();
                const moment = v1TestingSequence.stage1_2_SyncConfirmationMoment;

                const r = await api.loadRulesets({ delegator: delegator, voter: voter }, moment);
                expect(r).to.be.an("array").with.length(0);
            });
        });

        describe("#sendToBlockchain", () => {
            it("Sends without error and returns non-zero SteemOperationNumber", async () => {
                const son = await api.sendToBlockchain([["vote", {
                    voter: "guest123",
                    author: "noisy",
                    permlink: "7nw1oeev",
                    weight: 5000
                }]]);

                expect(son.blockNum).to.not.equal(0);
            });
        });

        describe("#getLastConfirmationMoment", () => {
            it("Returns correct last confirmation moment of steemprojects3", async () => {
                const son = await api.getLastConfirmationMoment("steemprojects3");

                expect(son.blockNum).to.be.gte(22485801);
            });
        });

        describe("#loadRulesets (for delegator and all voters)", () => {
            it("Loads properly all rulesets from protocol-v1-testing-sequence", async () => {
                const requiredRulesets: { ruleset: v1TestingSequence.RulesetsAtMoment, found: boolean } [] = [
                    // { ruleset: v1TestingSequence.stage1_0_Rulesets, found: false },
                    { ruleset: v1TestingSequence.stage2_1_Rulesets, found: false },
                    // { ruleset: v1TestingSequence.stage3_0_Rulesets, found: false } // this is an v1 reseting set_rules. There is no easy way to port it to V2.
                ];

                const result: EffectuatedSetRules [] = await api.loadRulesets({ delegator: v1TestingSequence.delegator }, v1TestingSequence.stage3_1_SyncConfirmationMoment);
                for (const sr of result) {
                    for (let i = 0; i < requiredRulesets.length; i++) {
                        if (sr.moment.isEqual_solveOpInTrxBug(requiredRulesets[i].ruleset.opNum)) {
                            requiredRulesets[i].found = true;
                        }
                    }
                }

                for (let i = 0; i < requiredRulesets.length; i++) {
                    expect(requiredRulesets[i].found, "requiredRulesets[" + i + "].found").to.be.true;
                }
            });

            it("Does load properly rulesets that were current for noisy at b23589679", async () => {
                const result: EffectuatedSetRules [] = await api.loadRulesets({ delegator: "noisy" }, new SteemOperationNumber(23589679, 0, 0));
                result.forEach(esr => {
                    if (esr.voter === "innuendo") { // returns only tyhe most current rulesey for innuendo
                        expect (esr.moment.blockNum).to.be.equal(25286929);
                    }
                    expect(esr.moment.blockNum).to.be.lte(23589679);
                });
                expect(result).to.be.an("array").with.length(18);
            });

            it("Does not load any rulesets if user did not have any at the moment", async () => {
                const result: EffectuatedSetRules [] = await api.loadRulesets({ delegator: "innuendo" }, new SteemOperationNumber(24389679, 0, 0));
                expect(result).to.be.an("array").with.length(0);
            });

            it("Loads all new rulesets when moment is SteemOperationNumber.FUTURE and does not load the old ones", async () => {
                const result: EffectuatedSetRules [] = await api.loadRulesets({ delegator: "noisy" }, SteemOperationNumber.FUTURE);
                expect(result).to.be.an("array").with.length.gt(0);
                result.forEach(esr => {
                    if (esr.voter === "kolorowa.wedzma") { // this it good for testing because @noisy made a typo in account name and did not upload this mistaken ruleset anymore
                        expect(esr.moment.blockNum).to.be.equal(23630550);
                    }
                    expect(esr.moment.blockNum).to.be.gte(23630550);
                });
            });
        });

        describe("#getAllWiseOperationsInBlock", () => {
            it("Loads only wise operation from single block", async () => {
                const blockNum = 23487915;
                const ops: EffectuatedWiseOperation [] = await api.getAllWiseOperationsInBlock(blockNum);
                expect(ops).to.be.an("array").with.length(1);
                expect(ops[0].delegator, "ops[0].delegator").to.equal("steemprojects3");
                expect(ops[0].moment.blockNum, "ops[0] block_num").to.equal(blockNum);
                expect(ops[0].moment.transactionNum, "ops[0] transaction_num").to.equal(18);
            });

            it("Returns empty array if no operations are present", async () => {
                const blockNum = 1;
                const ops: EffectuatedWiseOperation [] = await api.getAllWiseOperationsInBlock(blockNum);
                expect(ops).to.be.an("array").with.length(0);
            });

            it("Waits for future block", async function () {
                this.timeout(40000);

                let blockNum: number;
                for (const api of apis) if (api.name() === "FakeApi") _.times(2, (num) => setTimeout(() => (api as any as FakeApi).pushFakeBlock(), 200 * num));

                const dgp: steem.DynamicGlobalProperties = await api.getDynamicGlobalProperties();
                blockNum = dgp.head_block_number;
                await api.getAllWiseOperationsInBlock(blockNum);
                blockNum++;
                await api.getAllWiseOperationsInBlock(blockNum);
                blockNum++;
                await api.getAllWiseOperationsInBlock(blockNum);
            });

            it("returns ConfirmVoteBoundWithVote instead of pure ConfirmVote", async () => {
                const blockNum = 24352800;
                const ops: EffectuatedWiseOperation [] = await api.getAllWiseOperationsInBlock(blockNum);
                expect(ops).to.be.an("array").with.length(1);
                expect(ConfirmVoteBoundWithVote.isConfirmVoteBoundWithVote(ops[0].command), "isConfirmVoteBoundWithVote(.cmd)").to.be.true;
                const expectedVoteOp: steem.VoteOperation = {
                    voter: "noisy",
                    author: "tkow",
                    permlink: "reklama-projektu-na-facebook-1",
                    weight: 1000
                };
                expect((<ConfirmVoteBoundWithVote>ops[0].command).vote, ".cmd.vote").to.deep.equal(expectedVoteOp);
            });
        });

        describe("#getWiseOperationsRelatedToDelegatorInBlock", () => {
            it("Loads only wise operation from single block", async () => {
                const blockNum = 23487915;
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperationsRelatedToDelegatorInBlock("steemprojects3", blockNum);
                expect(ops).to.be.an("array").with.length(1);
                expect(ops[0].delegator, "ops[0].delegator").to.equal("steemprojects3");
                expect(ops[0].moment.blockNum, "ops[0] block_num").to.equal(blockNum);
                expect(ops[0].moment.transactionNum, "ops[0] transaction_num").to.equal(18);
            });

            it("Returns empty array if no operations are present", async () => {
                const blockNum = 1;
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperationsRelatedToDelegatorInBlock("steemprojects3", blockNum);
                expect(ops).to.be.an("array").with.length(0);
            });

            it("Loads wise operations sent by voter but refering to delegator", async () => {
                const blockNum = 23944920; // steemprojects1 sent voteorder to delegatorsteemprojects2 in tx 48d7fa0b75c2bfaebce12571d86c57d53b8c7620
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperationsRelatedToDelegatorInBlock("steemprojects2", blockNum);
                expect(ops).to.be.an("array").with.length(1);
                expect(ops[0].moment.blockNum, "ops[0] block_num").to.equal(blockNum);
                expect(ops[0].delegator, "ops[0].delegator").to.equal("steemprojects2");
                expect(ops[0].voter, "ops[0].voter").to.equal("steemprojects1");
            });

            it("Does not load operations sent as a voter", async () => {
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperationsRelatedToDelegatorInBlock("guest123", 22484096);
                expect(ops).to.be.an("array").with.length(0);
            });

            it("Waits for future block", async function () {
                this.timeout(40000);

                let blockNum: number;
                for (const api of apis) if (api.name() === "FakeApi") _.times(2, (num) => setTimeout(() => (api as any as FakeApi).pushFakeBlock(), 200 * num));

                const dgp: steem.DynamicGlobalProperties = await api.getDynamicGlobalProperties();
                blockNum = dgp.head_block_number;
                await api.getWiseOperationsRelatedToDelegatorInBlock("guest123", blockNum);
                blockNum++;
                await api.getWiseOperationsRelatedToDelegatorInBlock("guest123", blockNum);
                blockNum++;
                await api.getWiseOperationsRelatedToDelegatorInBlock("guest123", blockNum);
            });

            it("returns ConfirmVoteBoundWithVote instead of pure ConfirmVote", async () => {
                const blockNum = 24352800;
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperationsRelatedToDelegatorInBlock("noisy", blockNum);
                expect(ops).to.be.an("array").with.length(1);
                expect(ConfirmVoteBoundWithVote.isConfirmVoteBoundWithVote(ops[0].command), "isConfirmVoteBoundWithVote(.cmd)").to.be.true;
                const expectedVoteOp: steem.VoteOperation = {
                    voter: "noisy",
                    author: "tkow",
                    permlink: "reklama-projektu-na-facebook-1",
                    weight: 1000
                };
                expect((<ConfirmVoteBoundWithVote>ops[0].command).vote, ".cmd.vote").to.deep.equal(expectedVoteOp);
            });
        });

        describe("#getDynamicGlobalProperties", () => {
            it("returns dynamic global properties without error", async () => {
                const dgp: steem.DynamicGlobalProperties = await api.getDynamicGlobalProperties();
                expect(dgp.head_block_number, "head_block_number").to.be.greaterThan(22484096);
                expect(dgp.vote_power_reserve_rate, "vote_power_reserve_rate").to.be.greaterThan(0);
                expect(new Date(dgp.time + "Z").getTime(), "time").to.be.closeTo(new Date().getTime(), 1000 * 10 /* 10 seconds */);
            });
        });

        describe("#getAccountInfo", () => {
            it("returns account info without error", async () => {
                const info: steem.AccountInfo = await api.getAccountInfo("guest123");
                expect(info.name, "name").to.be.equal("guest123");
                expect(info.voting_power, "voting_power").to.be.greaterThan(0);

                expect(info.vesting_shares, "vesting_shares").to.match(/^([0-9]+)\.([0-9]+)\ VESTS$/);
                expect(parseFloat(info.vesting_shares.replace(" VESTS", "")), "vesting_shares")
                    .to.be.a("number").greaterThan(0.0);

                expect(info.delegated_vesting_shares, "delegated_vesting_shares").to.match(/^([0-9]+)\.([0-9]+)\ VESTS$/);
                expect(parseFloat(info.delegated_vesting_shares.replace(" VESTS", "")), "delegated_vesting_shares")
                    .to.be.a("number").gte(0.0);

                expect(info.received_vesting_shares, "received_vesting_shares").to.match(/^([0-9]+)\.([0-9]+)\ VESTS$/);
                expect(parseFloat(info.received_vesting_shares.replace(" VESTS", "")), "received_vesting_shares")
                    .to.be.a("number").gte(0.0);

                expect(new Date(info.last_vote_time + "Z").getTime(), "last_vote_time").to.be.gte(new Date("2018-05-30T12:25:36").getTime());
            });

            it("throws NotFoundException if account does not exist", async () => {
                try {
                    const result = await api.getAccountInfo("nonexistent-" + Date.now());
                    throw new Error("Should fail on nonexistent account.");
                } catch (e) {
                    if (!NotFoundException.isNotFoundException(e)) throw e;
                }
            });
        });

        describe("#getWiseOperations", () => {
            it("Loads only wise operation that are newer than until", async () => {
                const until = new Date("2018-06-05T12:00:00Z");
                const username = "guest123";
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperations(username, until);
                expect(ops).to.be.an("array").with.length.gte(1);
                ops.forEach(op => expect(op.timestamp.getTime()).to.be.greaterThan(until.getTime()));
                expect(ops[0].delegator === username || ops[0].voter === username).to.be.true;
                expect(ops[0].moment.transactionNum, "ops[0] transaction_num").to.be.a("number").that.is.gte(0);
            });

            it("Returns empty array if no operations are present", async () => {
                const until = new Date(Date.now() + 24 * 3600); // today, plus one day
                const username = "guest123";
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperations(username, until);
                expect(ops).to.be.an("array").with.length(0);
            });

            it("Returns ConfirmVoteBoundWithVote instead of pure ConfirmVote (when accepted = true)", async () => {
                const until = new Date(Date.now() - 1000 * 3600 * 24 * 14); // last 14 days
                const ops: EffectuatedWiseOperation [] = await api.getWiseOperations("noisy", until);
                expect(ops).to.be.an("array").with.length.greaterThan(0);
                ops.forEach(op => {
                    if (ConfirmVote.isConfirmVote(op.command)) {
                        const confirmVoteCmd: ConfirmVote = op.command;
                        if (confirmVoteCmd.accepted) {
                            /*if (!isConfirmVoteBoundWithVote(confirmVoteCmd)) {
                                Log.log().debug("CONFIRM_VOTE_NOT_BOUND_WITH_VOTE=" + JSON.stringify(op));
                            }*/
                            expect(ConfirmVoteBoundWithVote.isConfirmVoteBoundWithVote(confirmVoteCmd), "isConfirmVoteBoundWithVote(.cmd)").to.be.true;
                            expect (confirmVoteCmd).to.haveOwnProperty("vote");
                        }
                    }
                });
            });
        });
        describe("#getBlogEntries", () => {
            it("Returns > 150 entries for noisy", async () => {
                const entries: steem.BlogEntry [] = await api.getBlogEntries("noisy", 0, 250);
                expect(entries).to.be.an("array").with.length.greaterThan(150);
                entries.forEach((entry: steem.BlogEntry) => {
                    expect(entry).to.haveOwnProperty("author");
                    expect(entry).to.haveOwnProperty("permlink");
                    expect(entry).to.haveOwnProperty("blog");
                    expect(entry).to.haveOwnProperty("reblog_on");
                    expect(entry).to.haveOwnProperty("entry_id");

                    expect(entry.blog).to.be.equal("noisy");
                });
            });

            it("Returns in order from newest to oldest", async () => {
                const entries: steem.BlogEntry [] = await api.getBlogEntries("noisy", 0, 250);
                let lastTime = new Date().getTime() + 1000;
                entries.forEach((entry: steem.BlogEntry) => {
                    const currentEntryTime = new Date(entry.reblog_on + "Z").getTime();
                    if (currentEntryTime > 0) { // this time is only > 0 for reblogs, but is useful for asserting order
                        expect(currentEntryTime).to.be.lte(lastTime);
                        lastTime = currentEntryTime;
                    }
                });
            });
        });
    }));

    describe("Temporarily test here v2 rules loading", () => {
        it("loads proper rules (v2)", async () => {
            const api = new DirectBlockchainApi(Wise.constructDefaultProtocol());
            const wise = new Wise("guest123", api);
            const delegator = "guest123";
            const voter = "guest123";
            const moment = new SteemOperationNumber(22806999, 38, 0);
            const esrArray = await api.loadRulesets({ delegator: delegator, voter: voter }, moment);
            expect(esrArray).to.be.an("array").with.length(1);
            const r: SetRules = esrArray[0];
            expect(r.rulesets).to.be.an("array").with.length(1);
            expect(r.rulesets[0].name).to.equal("test_purpose_ruleset");
        });
    });
});
