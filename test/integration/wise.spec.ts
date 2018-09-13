/* tslint:disable no-null-keyword */
// 3rd party imports
import { expect } from "chai";
import "mocha";
import * as _ from "lodash";
import * as Promise from "bluebird";

// wise imports
import { Log } from "../../src/util/log"; const log = Log.getLogger(); Log.setLevel("info");
import { DirectBlockchainApi, Wise, SteemOperationNumber, ValidationException, WeightRule, TagsRule, Ruleset, SetRulesForVoter, SendVoteorder } from "../../src/wise";
import { DisabledApi } from "../../src/api/DisabledApi";

const uniq = new Date();
const config = {
    username: "guest123",
    postingWif: "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg",
    validRulesetName: "valid-test-ruleset-" + uniq,
    rulesetsForVoters: [
        {
            voter: "steemprojects1",
            rulesets: [
                {
                    name: "Vote WISEly " + uniq,
                    rules: [
                        { rule: "weight", min: 0, max: 100 },
                        { rule: "tags", mode: "require", tags: [ "wise" ] },
                    ]
                },
                {
                    name: "Something else " + uniq,
                    rules: [
                        { rule: "first_post" },
                    ]
                }
            ]
        },
        {
            voter: "guest123",
            rulesets: [
                {
                    name: "Test ruleset " + uniq,
                    rules: [
                        { rule: "weight", min: 0, max: 100 },
                        { rule: "tags", mode: "any", tags: [ "wise", "pl-wise" ] },
                    ]
                }
            ]
        }
    ],
    rulesetsForVotersInvalidators: [ // to test if uploading invalid rulesets fail
        (rulesetsForVoters: object) => { _.unset(rulesetsForVoters, "[0].voter"); return rulesetsForVoters; },
        (rulesetsForVoters: object) => { _.unset(rulesetsForVoters, "[1].rulesets"); return rulesetsForVoters; },
        (rulesetsForVoters: object) => _.set(rulesetsForVoters, "[0].voter", ""),
        (rulesetsForVoters: object) => { _.unset(rulesetsForVoters, "[0].rulesets[1].name"); return rulesetsForVoters; },
        (rulesetsForVoters: object) => { _.unset(rulesetsForVoters, "[0].rulesets[1].rules"); return rulesetsForVoters; },
        (rulesetsForVoters: object) => _.set(rulesetsForVoters, "[0].rulesets[1].name", ""),
        (rulesetsForVoters: object) => { _.unset(rulesetsForVoters, "[0].rulesets[0].rules[0].rule"); return rulesetsForVoters; },
        (rulesetsForVoters: object) => _.set(rulesetsForVoters, "[0].rulesets[0].rules[0].rule", ""),
        (rulesetsForVoters: object) => _.set(rulesetsForVoters, "[0].rulesets[0].rules[0].rule", "nonexistent-rule-" + Date.now()),
        (rulesetsForVoters: object) => _.set(rulesetsForVoters, "[1].rulesets[0].rules[1].mode", "illegal-mode"),
    ],
    validVoteorder: {
        rulesetName: "Test ruleset " + uniq,
        permlink: "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise",
        author: "jblew",
        weight: 100
    },
    voteorderInvalidators: [
        (voteorder: object) => { _.unset(voteorder, "rulesetName"); return voteorder; },
        (voteorder: object) => { _.unset(voteorder, "permlink"); return voteorder; },
        (voteorder: object) => { _.unset(voteorder, "author"); return voteorder; },
        (voteorder: object) => { _.unset(voteorder, "weight"); return voteorder; },
        (voteorder: object) => _.set(voteorder, "weight", -90),
        (voteorder: object) => _.set(voteorder, "weight", 200),
        (voteorder: object) => _.set(voteorder, "author", "nonexistent-user-" + uniq),
    ],
    invalidatorForVoteorderSkipValidationTest: (voteorder: object) => _.set(voteorder, "weight", 200),
};

describe("test/integration/wise.spec.ts", () => {
    describe("Wise", function() {
        this.timeout(50 * 1000);

        const wise = new Wise(config.username, new DirectBlockchainApi(config.username, config.postingWif));

        describe("#constructor", () => {
            it ("Wise object has two protocol handlers", () => {
                expect(wise.getProtocol().getHandlers()).to.be.an("array").with.length(2);
            });
        });

        describe("#uploadRulesetsForVoter", () => {
            const tests: { name: string; rulesets: any []; pass: boolean } [] = [
                {
                    name: "Uploads empty ruleset array without error",
                    rulesets: [],
                    pass: true
                },
                {
                    name: "Uploads valid rulesets with no rules without error",
                    rulesets: [{
                        name: "valid_ruleset_with_no_rules",
                        rules: []
                    }],
                    pass: true
                },
                {
                    name: "Uploads valid ruleset without error",
                    rulesets: [{
                        name: config.validRulesetName,
                        rules: [
                            new WeightRule(0, 1000),
                            new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects"])
                        ]
                    }],
                    pass: true
                },
                {
                    name: "Fails to upload ruleset with empty name",
                    rulesets: [{
                        name: "",
                        rules: []
                    }],
                    pass: false
                },
                {
                    name: "Fails to upload ruleset with null name",
                    rulesets: [{
                        name: null,
                        rules: []
                    }],
                    pass: false
                },
                {
                    name: "Fails to upload ruleset without name",
                    rulesets: [{
                        rules: []
                    }],
                    pass: false
                },
                {
                    name: "Fails to upload ruleset without rules",
                    rulesets: [{
                        name: "invalid"
                    }],
                    pass: false
                },
                {
                    name: "Fails to upload ruleset with no properties",
                    rulesets: [{}],
                    pass: false
                }
            ];
            tests.forEach(test => it(test.name, () => {
                let proggressCallbackCalled: boolean = false;
                let resultCallback: any = false;
                let resultPromise: any = false;
                let errorCallback: any = false;
                let errorPromise: any = false;

                return wise.uploadRulesetsForVoter(
                    config.username, test.rulesets as any as Ruleset [],

                    (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        errorCallback = error;
                        resultCallback = result;
                    },

                    (msg: string, proggress: number): void => {
                        proggressCallbackCalled = true;
                    },
                )
                .then(
                    result => { resultPromise = result; errorPromise = undefined; },
                    error => { errorPromise = error; resultPromise = undefined; }
                )
                .then(() => Promise.delay(10))
                .then(() => {
                    expect(resultCallback, "resultCallback").to.not.equal(false);
                    expect(errorCallback, "errorCallback").to.not.equal(false);
                    expect(resultPromise, "resultPromise").to.not.equal(false);
                    expect(errorPromise, "errorPromise").to.not.equal(false);
                    if (test.pass) {
                        if (errorPromise || errorCallback) throw errorPromise;
                        expect(resultCallback, "resultCallback").is.instanceof(SteemOperationNumber);
                        expect(resultPromise, "resultPromise").is.instanceof(SteemOperationNumber);
                        expect(resultCallback, "resultCallback=(deep)=resultPromise").deep.equals(resultPromise);
                        expect(errorCallback, "errorCallback").to.be.undefined;
                        expect(errorPromise, "errorPromise").to.be.undefined;
                        expect(proggressCallbackCalled, "proggressCallbackCalled").to.be.true;
                    }
                    else {
                        if (resultCallback || resultPromise) throw new Error("Should fail");
                        expect(resultCallback, "resultCallback").to.be.undefined;
                        expect(resultPromise, "resultPromise").to.be.undefined;
                        expect(errorCallback, "errorCallback").to.be.instanceof(Error);
                        expect(errorPromise, "errorPromise").to.be.instanceof(Error);
                        expect(errorCallback, "errorCallback=(deep)=errorPromise").deep.equals(errorPromise);
                    }
                });
            }));
        });

        describe("#downloadRulesetsForVoter", () => {
            it("Downloads correctly rules set much time ago", () => {
                const delegator = "noisy";
                const voter = "jblew";
                const moment = new SteemOperationNumber(22900000, 0, 0);
                const validRulesetName = "co robia lekarze w kuchni? Leczo!";

                let resultCallback: any = false;
                let resultPromise: any = false;
                let errorCallback: any = false;
                let errorPromise: any = false;
                return wise.downloadRulesetsForVoter(delegator, voter,
                    (error: Error | undefined, result: Ruleset [] | undefined): void => {
                        errorCallback = error;
                        resultCallback = result;
                    },
                    moment
                )
                .then(
                    result => { resultPromise = result; errorPromise = undefined; },
                    error => { errorPromise = error; resultPromise = undefined; }
                )
                .then(() => Promise.delay(10))
                .then(() => {
                    if (errorPromise || errorCallback) throw errorPromise;
                    expect(resultCallback, "resultCallback").is.an("array").with.length(1);
                    expect(resultCallback, "resultCallback=(deep)=resultPromise").deep.equals(resultPromise);
                    expect(resultCallback[0].name, "ruleset[0].name").to.be.equal(validRulesetName);
                    expect(errorCallback, "errorCallback").to.be.undefined;
                    expect(errorPromise, "errorPromise").to.be.undefined;
                });
            });

            it("Downloads rulesets set by " + config.username + " for " + config.username + " in previous test", function () {
                this.timeout(80 * 1000);
                console.log("Waiting 60 seconds for rulesets to be available via account_history_api");
                return Promise.delay(20 * 1000)
                .then(() => console.log("40 seconds left..."))
                .then(() => Promise.delay(20 * 1000))
                .then(() => console.log("20 seconds left..."))
                .then(() => Promise.delay(20 * 1000))
                .then(() => console.log("Done waiting"))
                .then(() => wise.downloadRulesetsForVoter(config.username, config.username,
                    undefined, SteemOperationNumber.NOW
                ))
                .then(result => {
                    expect(result, "result").is.an("array").with.length(1);
                    expect(result[0].name, "ruleset[0].name").to.be.equal(config.validRulesetName);
                });
            });
        });

        describe("#uploadAllRulesets", () => {
            const tests: { name: string; rulesets: SetRulesForVoter []; pass: boolean } [] = [
                {
                    name: "Uploads valid rulesets without error", pass: true,
                    rulesets: config.rulesetsForVoters as SetRulesForVoter []
                }
            ];
            config.rulesetsForVotersInvalidators.forEach(invalidator => {
                tests.push({
                    name: "Fails to upload invalid ruleset invalidated by " + invalidator.toString(),
                    pass: false,
                    rulesets: invalidator(_.cloneDeep(config.rulesetsForVoters)) as SetRulesForVoter []
                });
            });
            tests.forEach(test => it(test.name, () => {
                let proggressCallbackCalled: boolean = false;
                let resultCallback: any = false;
                let resultPromise: any = false;
                let errorCallback: any = false;
                let errorPromise: any = false;

                return wise.uploadAllRulesets(
                    test.rulesets as any as SetRulesForVoter [],

                    (error: Error | undefined, result: SteemOperationNumber | true | undefined): void => {
                        errorCallback = error;
                        resultCallback = result;
                    },

                    (msg: string, proggress: number): void => {
                        proggressCallbackCalled = true;
                    },
                )
                .then(
                    result => { resultPromise = result; errorPromise = undefined; },
                    error => { errorPromise = error; resultPromise = undefined; }
                )
                .then(() => Promise.delay(10))
                .then(() => {
                    expect(resultCallback, "resultCallback").to.not.equal(false);
                    expect(errorCallback, "errorCallback").to.not.equal(false);
                    expect(resultPromise, "resultPromise").to.not.equal(false);
                    expect(errorPromise, "errorPromise").to.not.equal(false);
                    if (test.pass) {
                        if (errorPromise || errorCallback) throw errorPromise;
                        expect(resultCallback, "resultCallback").is.instanceof(SteemOperationNumber);
                        expect(resultPromise, "resultPromise").is.instanceof(SteemOperationNumber);
                        expect(resultCallback, "resultCallback=(deep)=resultPromise").deep.equals(resultPromise);
                        expect(errorCallback, "errorCallback").to.be.undefined;
                        expect(errorPromise, "errorPromise").to.be.undefined;
                        expect(proggressCallbackCalled, "proggressCallbackCalled").to.be.true;
                    }
                    else {
                        if (resultCallback || resultPromise) throw new Error("Should fail");
                        expect(resultCallback, "resultCallback").to.be.undefined;
                        expect(resultPromise, "resultPromise").to.be.undefined;
                        expect(errorCallback, "errorCallback").to.be.instanceof(Error);
                        expect(errorPromise, "errorPromise").to.be.instanceof(Error);
                        expect(errorCallback, "errorCallback=(deep)=errorPromise").deep.equals(errorPromise);
                    }
                });
            }));
        });

        describe("#downloadAllRulesets", () => {
            it("Downloads correctly rules set much time ago", () => {
                const delegator = "noisy";
                const moment = new SteemOperationNumber(23129457, 0, 0);
                const properVoters = [
                    "grecki-bazar-ewy", "cebula", "nicniezgrublem", "jblew", "lukmarcus", "lenka",
                    "noisy2", "andrejcibik"
                ];

                let resultCallback: any = false;
                let resultPromise: any = false;
                let errorCallback: any = false;
                let errorPromise: any = false;
                let proggressCallbackCalled: boolean = false;
                return wise.downloadAllRulesets(delegator,
                    (error: Error | undefined, result: SetRulesForVoter [] | undefined): void => {
                        errorCallback = error;
                        resultCallback = result;
                    },
                    moment,
                    (msg: string, proggress: number) => { proggressCallbackCalled = true; }
                )
                .then(
                    result => { resultPromise = result; errorPromise = undefined; },
                    error => { errorPromise = error; resultPromise = undefined; }
                )
                .then(() => Promise.delay(10))
                .then(() => {
                    if (errorPromise || errorCallback) throw errorPromise;
                    expect(resultCallback, "resultCallback").is.an("array").with.length.gt(1);
                    expect(resultCallback[0].rulesets, "resultCallback[0].rulesets").is.an("array").with.length.gte(1);

                    const voters = resultPromise.map((rfv: SetRulesForVoter) => rfv.voter);
                    expect(voters).to.be.an("array").with.length(properVoters.length).that.has.members(properVoters);

                    expect(resultCallback, "resultCallback=(deep)=resultPromise").deep.equals(resultPromise);
                    expect(errorCallback, "errorCallback").to.be.undefined;
                    expect(errorPromise, "errorPromise").to.be.undefined;
                    expect(proggressCallbackCalled, "proggressCallbackCalled").to.be.true;
                });
            });

            it("Downloads all rulesets set by " + config.username + " in previous test", function () {
                this.timeout(80 * 1000);
                console.log("Waiting 60 seconds for rulesets to be available via account_history_api");
                return Promise.delay(20 * 1000)
                .then(() => console.log("40 seconds left..."))
                .then(() => Promise.delay(20 * 1000))
                .then(() => console.log("20 seconds left..."))
                .then(() => Promise.delay(20 * 1000))
                .then(() => console.log("Done waiting"))
                .then(() => wise.downloadAllRulesets(config.username))
                .then(result => {
                    expect(result, "result").is.an("array").with.length(config.rulesetsForVoters.length);
                    const notMatching = config.rulesetsForVoters.filter(rfv => {
                        const found = result.filter(resultRfv => resultRfv.voter === rfv.voter);
                        if (found.length !== 1) return false;
                        expect(found[0].rulesets).deep.equal(rfv.rulesets);
                    }).filter(valid => !valid);
                    expect(notMatching, "notMatching").to.be.an("array").with.length(0);
                });
            });
        });

        describe("#generateVoteorderOperations", () => {
            it("generated weight is a number, not a string", () => {
                return wise.generateVoteorderOperations(
                    config.username, config.username, config.validVoteorder, undefined, () => {}, true
                )
                .then((ops: { [key: string]: any } []) => {
                    expect(ops).to.be.an("array").with.length(1);
                    const customJsonObj: { [key: string]: any } [] = JSON.parse(ops[0][1].json);
                    expect(customJsonObj[1].weight).to.be.a("number").that.is.greaterThan(0).and.not.be.a("string");
                });
            });
        });

        describe("#sendVoteorder", () => {
            let proggressCallbackCalled: boolean = false;
            let resultCallback: any = false;
            let resultPromise: any = false;
            let errorCallback: any = false;
            let errorPromise: any = false;

            const tests: { name: string; voteorder: SendVoteorder; skipValidation: boolean; pass: boolean; } [] = [
                { name: "Passes valid voteorder", voteorder: config.validVoteorder, skipValidation: false, pass: true }
            ];

            config.voteorderInvalidators.forEach(invalidator => {
                tests.push({
                    name: "Fails to upload invalid voteorder invalidated by " + invalidator.toString(),
                    pass: false,
                    skipValidation: false,
                    voteorder: invalidator(_.cloneDeep(config.validVoteorder)) as SendVoteorder
                });
            });

            tests.push({
                name: "Passes invalid voteorder invalidated by " + config.invalidatorForVoteorderSkipValidationTest.toString()
                     + " when skipValidation = true",
                pass: true,
                skipValidation: true,
                voteorder: config.invalidatorForVoteorderSkipValidationTest(_.cloneDeep(config.validVoteorder)) as SendVoteorder
            });

            tests.forEach(test => it(test.name, () => {
                return wise.sendVoteorder(config.username, test.voteorder,
                    (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        errorCallback = error;
                        resultCallback = result;
                    },
                    (msg: string, proggress: number) => { proggressCallbackCalled = true; },
                    test.skipValidation
                )
                .then(
                    result => { resultPromise = result; errorPromise = undefined; },
                    error => { errorPromise = error; resultPromise = undefined; }
                )
                .then(() => Promise.delay(10))
                .then(() => {
                    expect(resultCallback, "resultCallback").to.not.equal(false);
                    expect(errorCallback, "errorCallback").to.not.equal(false);
                    expect(resultPromise, "resultPromise").to.not.equal(false);
                    expect(errorPromise, "errorPromise").to.not.equal(false);
                    if (test.pass) {
                        if (errorPromise || errorCallback) throw errorPromise;
                        expect(resultCallback, "resultCallback").is.instanceof(SteemOperationNumber);
                        expect(resultPromise, "resultPromise").is.instanceof(SteemOperationNumber);
                        expect(resultCallback, "resultCallback=(deep)=resultPromise").deep.equals(resultPromise);
                        expect(errorCallback, "errorCallback").to.be.undefined;
                        expect(errorPromise, "errorPromise").to.be.undefined;
                        expect(proggressCallbackCalled, "proggressCallbackCalled").to.be.true;
                    }
                    else {
                        if (resultCallback || resultPromise) throw new Error("Should fail");
                        expect(resultCallback, "resultCallback").to.be.undefined;
                        expect(resultPromise, "resultPromise").to.be.undefined;
                        expect(errorCallback, "errorCallback").to.be.instanceof(Error);
                        expect(errorPromise, "errorPromise").to.be.instanceof(Error);
                        expect(errorCallback, "errorCallback=(deep)=errorPromise").deep.equals(errorPromise);
                    }
                });
            }));
        });

        describe("#validateVoteorder", () => {
            let proggressCallbackCalled: boolean = false;
            let resultCallback: any = false;
            let resultPromise: any = false;
            let errorCallback: any = false;
            let errorPromise: any = false;

            const tests: { name: string; voteorder: SendVoteorder; skipValidation: boolean; pass: boolean; } [] = [
                { name: "Passes valid voteorder", voteorder: config.validVoteorder, skipValidation: false, pass: true }
            ];

            config.voteorderInvalidators.forEach(invalidator => {
                tests.push({
                    name: "Fails to upload invalid voteorder invalidated by " + invalidator.toString(),
                    pass: false,
                    skipValidation: false,
                    voteorder: invalidator(_.cloneDeep(config.validVoteorder)) as SendVoteorder
                });
            });

            tests.forEach(test => it(test.name, () => {
                return wise.validateVoteorder(
                    config.username, config.username, test.voteorder, SteemOperationNumber.NOW,
                    (error: Error | undefined, result: ValidationException | true | undefined): void => {
                        errorCallback = error;
                        resultCallback = result;
                    },
                    (msg: string, proggress: number) => { proggressCallbackCalled = true; },
                )
                .then(
                    result => { resultPromise = result; errorPromise = undefined; },
                    error => { errorPromise = error; resultPromise = undefined; }
                )
                .then(() => Promise.delay(10))
                .then(() => {
                    expect(resultCallback, "resultCallback").to.not.equal(false);
                    expect(errorCallback, "errorCallback").to.not.equal(false);
                    expect(resultPromise, "resultPromise").to.not.equal(false);
                    expect(errorPromise, "errorPromise").to.not.equal(false);
                    expect(errorCallback, "errorCallback").to.be.undefined;
                    expect(errorPromise, "errorPromise").to.be.undefined;
                    expect(proggressCallbackCalled, "proggressCallbackCalled").to.be.true;
                    expect(resultCallback, "resultCallback=(deep)=resultPromise").deep.equals(resultPromise);
                    if (errorPromise || errorCallback) throw errorPromise;

                    if (test.pass) {
                        expect(resultCallback, "resultCallback").is.equal(true);
                        expect(resultPromise, "resultPromise").is.equal(true);
                    }
                    else {
                        expect(resultCallback, "resultCallback").is.instanceof(ValidationException);
                        expect(resultPromise, "resultPromise").is.instanceof(ValidationException);
                    }
                });
            }));
        });

        describe("#getLastConfirmationMoment", () => { /* this can be tested only in daemon tests */ });

        describe("#startDaemon", () => { /* daemon has separate tests */ });

        describe("#getProtocol", () => {
            it ("has two handlers", () => {
                expect(wise.getProtocol().getHandlers()).to.be.an("array").with.length(2);
            });
        });
    });
});
