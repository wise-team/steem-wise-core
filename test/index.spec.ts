import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";
import * as _ from "lodash";

import { DirectBlockchainApi, Wise, SteemOperationNumber, ValidationException } from "../src/wise";
import { DisabledApi } from "../src/api/DisabledApi";

import * as data from "./data/index.data";
import { CustomJsonOperation } from "../src/blockchain/CustomJsonOperation";
import { V2Handler } from "../src/protocol/versions/v2/V2Handler";


describe("test/index.spec.ts", () => {
    describe("Wise", function() {
        this.timeout(30 * 1000);

        const username = "guest123";
        const postingWif = "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg";
        const wise = new Wise(username, new DirectBlockchainApi(username, postingWif));

        describe("#sendRules", () => {
            it("sends valid rules without error", (done) => {
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

        describe("#sendRulesAsync", () => {
            it("sends valid rules without error", () => {
                return wise.sendRulesAsync(data.sendRules_valid.voter, data.sendRules_valid.rules);
            });
        });

        describe("#sendVoteorder", () => {
            it("sends valid voteorder", (done) => {
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

            it.only("quickly fails to send voteorder with invalid structure", function (done) {
                this.timeout(100);
                const structChanged = _.set(_.cloneDeep(data.sendVoteorder_valid.voteorder), "weight", "string instead of number");
                wise.sendVoteorder(data.sendVoteorder_valid.delegator, structChanged, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                    if (error) done();
                    else done(new Error("Inconsistent state: no error and no result"));
                });
            });

            it.only("refuses to send invalid voteorder", (done) => {
                wise.sendVoteorder(data.sendVoteorder_invalid.delegator, data.sendVoteorder_invalid.voteorder, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                    if (error) done();
                    else done(new Error("Inconsistent state: no error and no result"));
                });
            });
        });


        describe("#sendVoteorderAsync", () => {
            it("sends valid voteorder", () => {
                return wise.sendVoteorderAsync(data.sendVoteorder_valid.delegator, data.sendVoteorder_valid.voteorder);
            });

            it.only("quickly fails to send voteorder with invalid structure", function () {
                this.timeout(100);
                const structChanged = _.set(_.cloneDeep(data.sendVoteorder_valid.voteorder), "weight", "string instead of number");
                return wise.sendVoteorderAsync(data.sendVoteorder_valid.delegator, structChanged)
                .then(() => {
                    throw new Error("Should fail on invalid voteorder");
                }, () => {
                    // it is ok
                });
            });

            it.only("refuses to send invalid voteorder", () => {
                return wise.sendVoteorderAsync(data.sendVoteorder_invalid.delegator, data.sendVoteorder_invalid.voteorder)
                .then(() => {
                    throw new Error("Should fail on invalid voteorder");
                }, () => {
                    // it is ok
                });
            });
        });


        describe("#validateOperation", () => {
            it("rejects valid v1 operation (this is disabled version of protocol). It is handled, but it is not valid according to new protocol", () => {
                const wise = new Wise("steemprojects1", new DisabledApi());
                const obj = JSON.parse('["custom_json",{"required_auths":[],"required_posting_auths":["steemprojects1"],"id":"smartvote","json":"{\\"name\\":\\"send_voteorder\\",\\"voteorder\\":{\\"ruleset_name\\":\\"RulesetOneChangesContent\\",\\"delegator\\":\\"steemprojects2\\",\\"type\\":\\"upvote\\",\\"weight\\":10,\\"author\\":\\"pojan\\",\\"permlink\\":\\"how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad\\"}}"}]');
                expect(wise.validateOperation(obj)).to.be.false;
            });

            /* tslint:disable:whitespace */
            const validV2Ops: [string, object][] = [
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{\"delegator\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:set_rules\",{\"voter\":\"guest123\",\"rulesets\":[[\"test_purpose_ruleset\",[{\"rule\":\"weight\",\"mode\":\"single_vote_weight\",\"min\":0,\"max\":1000},{\"rule\":\"tags\",\"mode\":\"require\",\"tags\":[\"steemprojects\"]}]]]}]",required_auths:[],required_posting_auths:["guest123"]}]
            ];
            validV2Ops.forEach((op: [string, object]) => {
                it("passes valid v2 operation", () => {
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
                it("rejects invalid v2 operation", () => {
                    const wise = new Wise("guest123", new DisabledApi());
                    expect(wise.validateOperation(op)).to.be.false;
                });
            });
            /* tslint:enable:whitespace */
        });


        describe("#validateVoteorder", () => {
            it.only("passes valid voteorder", (done) => {
                wise.validateVoteorder(data.sendVoteorder_valid.delegator, data.sendVoteorder_valid.voter, data.sendVoteorder_valid.voteorder, SteemOperationNumber.FUTURE, (error: Error | undefined, result: true | ValidationException | undefined) => {
                    if (error) done(error);
                    else if (result === true) done();
                    else done(result);
                });
            });

            it.only("fails on rules not fulfilled", (done) => {
                return wise.validateVoteorder(data.sendVoteorder_invalid.delegator, data.sendVoteorder_invalid.voter, data.sendVoteorder_invalid.voteorder, SteemOperationNumber.FUTURE, (error: Error | undefined, result: true | ValidationException | undefined) => {
                    if (error) done(error);
                    else if (result === true) done(new Error("Should mark as invalid"));
                    else done();
                });
            });
        });


        describe("#validateVoteorderAsync", () => {
            it.only("passes valid voteorder", () => {
                return wise.validateVoteorderAsync(data.sendVoteorder_valid.delegator, data.sendVoteorder_valid.voter, data.sendVoteorder_valid.voteorder, SteemOperationNumber.FUTURE);
            });

            it.only("fails on rules not fulfilled", () => {
                return wise.validateVoteorderAsync(data.sendVoteorder_invalid.delegator, data.sendVoteorder_invalid.voter, data.sendVoteorder_invalid.voteorder, SteemOperationNumber.FUTURE)
                .then((result: ValidationException | true) => {
                    if (result === true) throw new Error("Should fail");
                });
            });
        });


        describe("#validatePotentialVoteorder", () => {
            it.only("passes valid voteorder", (done) => {
                wise.validatePotentialVoteorder(data.sendVoteorder_valid.delegator, data.sendVoteorder_valid.voter, data.sendVoteorder_valid.voteorder, (error: Error | undefined, result: true | ValidationException | undefined) => {
                    if (error) done(error);
                    else if (result === true) done();
                    else done(result);
                });
            });

            it.only("fails on rules not fulfilled", (done) => {
                return wise.validatePotentialVoteorder(data.sendVoteorder_invalid.delegator, data.sendVoteorder_invalid.voter, data.sendVoteorder_invalid.voteorder, (error: Error | undefined, result: true | ValidationException | undefined) => {
                    if (error) done(error);
                    else if (result === true) done(new Error("Should mark as invalid"));
                    else done();
                });
            });
        });


        describe("#validatePotentialVoteorderAsync", () => {
            it.only("passes valid voteorder", () => {
                return wise.validatePotentialVoteorderAsync(data.sendVoteorder_valid.delegator, data.sendVoteorder_valid.voter, data.sendVoteorder_valid.voteorder);
            });

            it.only("fails on rules not fulfilled", () => {
                return wise.validatePotentialVoteorderAsync(data.sendVoteorder_invalid.delegator, data.sendVoteorder_invalid.voter, data.sendVoteorder_invalid.voteorder)
                .then((result: ValidationException | true) => {
                    if (result === true) throw new Error("Should fail");
                });
            });
        });
    });


    /*describe("RulesValidator.validatePotentialVoteOrder [delegator=steemprojects1, voter=guest123]", function() {
        this.retries(1);

        it("allows too high weight", function(done) {
            this.timeout(10000);
            const voteorder: smartvotes_voteorder = _objectAssign({}, validVoteorder, { rulesetName: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: 3 });
            wise.validatePotentialVoteOrder(voter, voteorder, function(error: Error | undefined, result: true | ValidationException | undefined | undefined) {
                if (error || result) done(error);
                else done();
            });
        });

        [-1, 0, undefined, NaN, Infinity].forEach(function(weight) {
            it("fails on invald weight type (" + weight + ")", function(done) {
                this.timeout(10000);
                const voteorder: smartvotes_voteorder = _objectAssign({}, validVoteorder, { rulesetName: steemprojects1Rulesets.upvoteNoRulesMaxWeight2.name, weight: weight });
                wise.validatePotentialVoteOrder(voter, voteorder, function(error: Error | undefined, result: true | ValidationException | undefined | undefined) {
                    if (error && !result) done();
                    else done(new Error("Should fail on invald weight (" + weight + ")"));
                });
            });
        });
    }); * / // disable because they are not moment-safe (rules of @steemprojects1 can change over time)

    describe("RulesValidator.validateVoteOrder#proggressCallback [delegator=steemprojects1, voter=guest123]", function() {
        let proggressCounter: number = 0;

        it("calls proggressCallback at least 4 times", function(done) {
            this.timeout(10000);

            const voteorder = validVoteorder;
            wise.validateVoteorder(voter, voteorder, rulesetMomentForValidation, function(error: Error | undefined, result: true | ValidationException | undefined | undefined) {
                if (error) done(error);
                else {
                    if (proggressCounter >= 4) done();
                    else done(new Error("Proggress callback should be called at leas 4 times"));
                }
            }, function(msg: string, proggress: number) {
                proggressCounter++;
            });
        });
    });*/
});
