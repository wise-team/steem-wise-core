import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";

import { DirectBlockchainApi, Wise, SteemOperationNumber } from "../src/wise";
import { DisabledApi } from "../src/api/DisabledApi";

import * as data from "./data/index.data";
import { Mutex } from "./util/Semaphore";
import { CustomJsonOperation } from "../src/blockchain/CustomJsonOperation";
import { V2Handler } from "../src/protocol/versions/v2/V2Handler";


describe("test/index.spec.ts", () => {
    describe("Wise", function() {
        this.timeout(30 * 1000);

        const username = "guest123";
        const postingWif = "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg";
        const wise = new Wise(username, new DirectBlockchainApi(username, postingWif));

        const sendRulesMutex: Mutex = new Mutex();

        describe("#sendRules", () => {
            it("sends valid rules without error", (mochaDone) => {
                sendRulesMutex.acquire().then(releaseMutex => {
                    const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                    wise.sendRules(data.sendRules_valid.voter, data.sendRules_valid.rules, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        if (error) done(error);
                        else {
                            if (result) {
                                if (result && result.blockNum && result.blockNum > 1) done();
                                else done(new Error("#sendRules did not returned valid block number"));
                            }
                            else done(new Error("Inconsistent state: no error and no result"));
                        }
                    });
                });
            });
        });


        describe("#sendVoteorder", () => {
            it("sends valid voteorder", (mochaDone) => {
                sendRulesMutex.acquire().then(releaseMutex => {
                    const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                    wise.sendVoteorder(data.sendVoteorder_valid.delegator, data.sendVoteorder_valid.voteorder, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        if (error) done(error);
                        else {
                            if (result) {
                                if (result && result.blockNum && result.blockNum > 1) done();
                                else done(new Error("#sendVoteorder did not returned valid block number"));
                            }
                            else done(new Error("Inconsistent state: no error and no result"));
                        }
                    });
                });
            });

            it("refuses to send invalid voteorder", (mochaDone) => {
                sendRulesMutex.acquire().then(releaseMutex => {
                    const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                    wise.sendVoteorder(data.sendVoteorder_invalid.delegator, data.sendVoteorder_valid.voteorder, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        if (error) done(error);
                        else {
                            if (result) done();
                            else done(new Error("Inconsistent state: no error and no result"));
                        }
                    });
                });
            });
        });


        describe("#validateOperation", () => {
            /* tslint:disable:whitespace */
            it("passes valid v1 operation", () => {

            });

            it("rejects invalid v1 operation", () => {

            });

            const validV2Ops: [string, object][] = [
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{\"delegator\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:set_rules\",{\"voter\":\"guest123\",\"rulesets\":[[\"test_purpose_ruleset\",[{\"rule\":\"weight\",\"mode\":\"single_vote_weight\",\"min\":0,\"max\":1000},{\"rule\":\"tags\",\"mode\":\"require\",\"tags\":[\"steemprojects\"]}]]]}]",required_auths:[],required_posting_auths:["guest123"]}]
            ];
            validV2Ops.forEach((op: [string, object]) => {
                it.only("passes valid v2 operation", () => {
                    const wise = new Wise("guest123", new DisabledApi());
                    expect(wise.validateOperation(op)).to.be.true;
                });
            });

            const invalidV2Ops: [string, object][] = [
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorde\",{\"delegator\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v3:send_voteorder\",{\"delegator\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{\"deleg\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000,\"sth_wrong\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{}]",required_auths:[],required_posting_auths:["guest123"]}],["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{\"a\":\"b\"}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:set_rules\",{\"voter\":\"guest123\",\"rulesets\":[[\"test_purpose_ruleset\",[{\"rule\":\"strange_rule\",\"mode\":\"single_vote_weight\",\"min\":0,\"max\":1000},{\"rule\":\"tags\",\"mode\":\"require\",\"tags\":[\"steemprojects\"]}]]]}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:set_rules\",{\"voter\":\"guest123\",\"rulesets\":[[\"test_purpose_ruleset\",[{\"rule\":\"weight\",\"mode\":\"single_vote_weight\",\"min\":0,\"max\":20000},{\"rule\":\"tags\",\"mode\":\"require\",\"tags\":[\"steemprojects\"]}]]]}]",required_auths:[],required_posting_auths:["guest123"]}]
            ];
            invalidV2Ops.forEach((op: [string, object]) => {
                it.only("rejects invalid v2 operation", () => {
                    const wise = new Wise("guest123", new DisabledApi());
                    expect(wise.validateOperation(op)).to.be.false;
                });
            });
            /* tslint:enable:whitespace */
        });
    });
});
