// 3rd party imports
import { expect } from "chai";
import "mocha";

// wise imports
import { AgeOfPostRule, SendVoteorder, ValidationException, Wise } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { FakeWiseFactory } from "./util/FakeWiseFactory";

/* CONFIG */
const voter = "nonexistentvoter";
const delegator = "nonexistentdelegator";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/rule-ageofpost.spec.ts", () => {
    describe("AgeOfPostRule", function() {
        const tests: { mode: AgeOfPostRule.Mode, unit: AgeOfPostRule.TimeUnit, value: number, deltaTimeS: number, pass: boolean } [] = [
            {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.DAY, value: 5,
                deltaTimeS: -(6 * 24 * 3600), pass: true
            }, {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.DAY, value: 5,
                deltaTimeS: -(4 * 24 * 3600), pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.DAY, value: 5,
                deltaTimeS: -(6 * 24 * 3600), pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.DAY, value: 5,
                deltaTimeS: -(4 * 24 * 3600), pass: true
            }, {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.HOUR, value: 5,
                deltaTimeS: -(6 * 3600), pass: true
            }, {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.HOUR, value: 5,
                deltaTimeS: -(4 * 3600), pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.HOUR, value: 5,
                deltaTimeS: -(6 * 3600), pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.HOUR, value: 5,
                deltaTimeS: -(4 * 3600), pass: true
            }, {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.MINUTE, value: 5,
                deltaTimeS: -(6 * 60), pass: true
            }, {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.MINUTE, value: 5,
                deltaTimeS: -(4 * 60), pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.MINUTE, value: 5,
                deltaTimeS: -(6 * 60), pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.MINUTE, value: 5,
                deltaTimeS: -(4 * 60), pass: true
            }, {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.SECOND, value: 5,
                deltaTimeS: -6, pass: true
            }, {
                mode: AgeOfPostRule.Mode.OLDER_THAN, unit: AgeOfPostRule.TimeUnit.SECOND, value: 5,
                deltaTimeS: -4, pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.SECOND, value: 5,
                deltaTimeS: -6, pass: false
            }, {
                mode: AgeOfPostRule.Mode.YOUNGER_THAN, unit: AgeOfPostRule.TimeUnit.SECOND, value: 5,
                deltaTimeS: -4, pass: true
            },
        ];

        tests.forEach((test, i: number) => it(
                "AgeOfPostRule " + ( test.pass ? "should pass" : "should fail" ) + ": " +
                "mode=" + test.mode + ", value = " + test.value + ", unit = " + test.unit + ", deltaTimeS=" + test.deltaTimeS, () => {
            const rule = new AgeOfPostRule(test.mode, test.value, test.unit);

            const isoStr = new Date(Date.now() + test.deltaTimeS * 1000).toISOString();
            const post = fakeDataset.posts[0];
            post.created = isoStr.substring(0, isoStr.length - 1);

            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: post.author,
                permlink: post.permlink
            };
            const context = new ValidationContext(fakeApi, wise.getProtocol(), delegator, voter, voteorder);

            return rule.validate(voteorder, context)
            .then(() => { // passed
                if (!test.pass) throw new Error("Should fail");
            },
            (error) => { // failed
                if (test.pass) throw error;
                else {
                    if (!(error as ValidationException).validationException)
                        throw new Error("Should fail with ValidationException");
                }
            });
        }));
    });
});
