import { assert, expect } from "chai";
import { Promise } from "bluebird";
import "mocha";

import { Wise } from "../src/wise";
import { Api } from "../src/api/Api";
import { DirectBlockchainApi } from "../src/api/directblockchain/DirectBlockchainApi";
import { WiseRESTApi } from "../src/api/WiseRESTApi";
import { SteemPost } from "../src/blockchain/SteemPost";
import { SteemOperationNumber } from "../src/blockchain/SteemOperationNumber";
import { SetRules, EffectuatedSetRules } from "../src/protocol/SetRules";
import { WeightRule } from "../src/rules/WeightRule";
import { TagsRule } from "../src/rules/TagsRule";

import * as v1TestingSequence from "./data/protocol-v1-testing-sequence";
import { Rule } from "../src/rules/Rule";

describe("test/api.spec.ts", function () {
    this.timeout(10000);

    const username = "guest123";
    const postingWif = "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg";

    [
        new DirectBlockchainApi(username, postingWif),
        new WiseRESTApi(WiseRESTApi.NOISY_ENDPOINT_HOST, username, postingWif)
    ]
    .forEach((api: Api) => describe("api " + api.name(), () => {
        const wise = new Wise(username, api);
        /**
         * Test post loading for each api
         */
        describe("#loadPost", () => {
            it("loads correct post", () => {
                return api.loadPost("noisy", "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that")
                    .then((post: SteemPost) => {
                        expect(post.author).to.be.equal("noisy");
                        expect(post.permlink).to.be.equal("dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that");
                        assert(post.body.indexOf("Declining a payout from a comment was possible even earlier, however it was always difficult to do that without some programming skills.") !== -1);

                        expect((JSON.parse(post.json_metadata) as SteemPost.JSONMetadata).tags)
                            .to.be.an("array").that.includes("voting").and.includes("steem").and.includes("steemit")
                            .and.has.length(3);
                    });
            });

            it("fails on nonexistent post", (done) => {
                api.loadPost("noisy", "nonexistent-permlink-" + new Date())
                    .then((result) => done(new Error("Should fail on nonexistent post. Got some data instead.")), () => done());
            });
        });

        /**
         * Test loading rulesets
         */
        describe("#loadRulesets", () => {
            it("returns empty list if no rulesets are set (does not fall silently)", () => {
                const delegator = "steemprojects2";
                const voter = "steemprojects1";
                const moment = new SteemOperationNumber(22144254, 42, 0); // before this moment @steemprojects2 has no rules for anyone
                return api.loadRulesets(delegator, voter, moment, wise.getProtocol())
                .then(((r: SetRules) => {
                    expect(r.rulesets).to.be.an("array").that.has.length(0);
                }));
            });

            it("loads proper rules (v1)", () => {
                const delegator = v1TestingSequence.stage1_0_RulesetsUsername;
                const voter = v1TestingSequence.stage1_0_Rulesets.rulesets[0].voter;
                const moment = v1TestingSequence.stage1_2_SyncConfirmationMoment;
                return api.loadRulesets(delegator, voter, moment, wise.getProtocol())
                .then(((r: SetRules) => {
                    expect(r.rulesets).to.be.an("array").with.length(v1TestingSequence.stage1_0_Rulesets.rulesets.length);
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
                }));
            });

            it("returns no rules for non existing delegator", () => { // TODO or throw? decide which better
                const delegator = "nonexistent-" + new Date();
                const voter = v1TestingSequence.stage1_0_Rulesets.rulesets[0].voter;
                const moment = v1TestingSequence.stage1_2_SyncConfirmationMoment;
                return api.loadRulesets(delegator, voter, moment, wise.getProtocol())
                .then(((r: SetRules) => {
                    expect(r.rulesets).to.be.an("array").with.length(0);
                }));
            });

            it("returns no rules for non existing voter", () => { // TODO or throw? decide which better
                const delegator = v1TestingSequence.stage1_0_RulesetsUsername;
                const voter = "nonexistent-" + new Date();
                const moment = v1TestingSequence.stage1_2_SyncConfirmationMoment;
                return api.loadRulesets(delegator, voter, moment, wise.getProtocol())
                .then(((r: SetRules) => {
                    expect(r.rulesets).to.be.an("array").with.length(0);
                }));
            });
        });

        describe("#sendToBlockchain", () => {
            it("Sends without error and returns non-zero SteemOperationNumber", () => {
                return api.sendToBlockchain([["vote", {
                    voter: "guest123",
                    author: "noisy",
                    permlink: "7nw1oeev",
                    weight: 5000
                }]])
                .then((son: SteemOperationNumber) => {
                    expect(son.blockNum).to.not.equal(0);
                });
            });
        });

        describe("#getLastConfirmationMoment", () => {
            it("Returns correct last confirmation moment of steemprojects3", () => {
                return api.getLastConfirmationMoment("steemprojects3", wise.getProtocol())
                .then((son: SteemOperationNumber) => {
                    expect(son.blockNum).to.be.gte(22485801);
                });
            });
        });

        describe("#loadAllRulesets", () => {
            it.only("Loads properly all rulesets from protocol-v1-testing-sequence", () => {
                const requiredRulesets: { ruleset: v1TestingSequence.RulesetsAtMoment, found: boolean } [] = [
                    { ruleset: v1TestingSequence.stage1_0_Rulesets, found: false },
                    { ruleset: v1TestingSequence.stage2_1_Rulesets, found: false },
                    // { ruleset: v1TestingSequence.stage3_0_Rulesets, found: false } // this is an v1 reseting set_rules. There is no easy way to port it to V2.
                ];

                return api.loadAllRulesets(v1TestingSequence.delegator, v1TestingSequence.stage3_1_SyncConfirmationMoment, wise.getProtocol())
                .then((result: EffectuatedSetRules []) => {
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
            });
        });

        describe("#getWiseOperationsRelatedToDelegatorInBlock", () => {
            it.skip("TODO write tests", () => {});
        });
    }));

    describe("Temporarily test here v2 rules loading", () => {
        it("loads proper rules (v2)", () => {
            const api = new DirectBlockchainApi("guest123", "");
            const wise = new Wise("guest123", api);
            const delegator = "guest123";
            const voter = "guest123";
            const moment = new SteemOperationNumber(22806999, 38, 0);
            return api.loadRulesets(delegator, voter, moment, wise.getProtocol())
            .then(((r: SetRules) => {
                expect(r.rulesets).to.be.an("array").with.length(1);
                expect(r.rulesets[0].name).to.equal("test_purpose_ruleset");
            }));
        });
    });
});
