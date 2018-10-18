// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../../src/util/log";

// wise imports
import { ExpirationDateRule, SendVoteorder, ValidationException, Wise } from "../../src/wise";
import { ValidationContext } from "../../src/validation/ValidationContext";
import { FakeWiseFactory } from "../util/FakeWiseFactory";
import { wise_rule_age_of_post_encode, wise_rule_age_of_post_decode, wise_rule_age_of_post } from "../../src/protocol/versions/v2/rules/rule-age-of-post-schema";

/* CONFIG */
const voter = "nonexistentvoter";
const delegator = "nonexistentdelegator";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/unit/rule-expirationdate.spec.ts", () => {
    describe("ExpirationDateRule", function() {
        const tests: { name: string; ruleDate: () => string, pass: boolean} [] = [
            { name: "Allows ISO date", ruleDate: () => new Date(Date.now() + 60 * 1000).toISOString(), pass: true },
            { name: "Allows IEFT date", ruleDate: () => new Date(Date.now() + 60 * 1000).toUTCString(), pass: true },
            { name: "Fails on non ISO nor IEFT date", ruleDate: () => (Date.now() + 60 * 1000) + "", pass: false },
            { name: "Passes non expired rule", ruleDate: () => new Date(Date.now() + 60 * 1000).toISOString(), pass: true },
            { name: "Fails on expired rule", ruleDate: () => new Date(Date.now() - 60 * 1000).toISOString(), pass: false },
        ];

        tests.forEach((test, i: number) => it(
                "ExpirationDateRule: " + test.name, () => {
            const rule = new ExpirationDateRule(test.ruleDate());

            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: fakeDataset.posts[0].author,
                permlink: fakeDataset.posts[0].permlink
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
