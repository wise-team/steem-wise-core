import { assert, expect } from "chai";
import { Promise } from "bluebird";
import "mocha";

import { Wise } from "../src/wise";
import { Api } from "../src/api/Api";
import { DirectBlockchainApi } from "../src/api/DirectBlockchainApi";
import { WiseRESTApi } from "../src/api/WiseRESTApi";
import { SteemPost } from "../src/blockchain/SteemPost";
import { SteemOperationNumber } from "../src/blockchain/SteemOperationNumber";
import { SetRules } from "../src/protocol/SetRules";
import { WeightRule } from "../src/rules/WeightRule";
import { TagsRule } from "../src/rules/TagsRule";

import * as v1TestingSequence from "./data/protocol-v1-testing-sequence";

describe("test/api.spec.ts", function () {
    this.timeout(10000);

    const username = "steemprojects1";
    const postingWif = "";

    [
        new DirectBlockchainApi(username, postingWif),
        new WiseRESTApi(username, postingWif)
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

            it("loads proper rules", () => {
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
                        expect(receivedRuleset.rules).to.include(new WeightRule(WeightRule.Mode.VOTES_PER_DAY, 0, expectedRuleset.total_weight));
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

        describe("#streamSince", () => {
            it.skip("TODO write tests", () => {});
        });
        describe("#sendToBlockchain", () => {
            it.skip("TODO write tests", () => {});
        });
    }));
});
