// 3rd party imports
import { expect } from "chai";
import "mocha";

// wise imports
import { AgeOfPostRule, SendVoteorder, ValidationException, Wise, FirstPostRule } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { FakeWiseFactory } from "./util/FakeWiseFactory";

/* CONFIG */
const voter = "nonexistentvoter";
const delegator = "nonexistentdelegator";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/rule-firstpost.spec.ts", () => {
    describe("FirstPostRule", function() {
        const tests: { author: string; permlink: string; pass: boolean; } [] = [
            {
                author: "jblew", permlink: "witajcie-steemianie-przybywam-jedrzej-lewandowski", pass: true
            },
            {
                author: "jblew", permlink: "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise", pass: false
            },
            {
                author: "perduta", permlink: "game-that-i-fall-in-love-with-as-developer", pass: true
            },
            {
                author: "perduta", permlink: "do-you-feel-connected-to-your-home-country", pass: false
            }
        ];

        tests.forEach((test, i: number) => it(
                "FirstPostRule " + ( test.pass ? "should pass" : "should fail" ) + ": " +
                "autnor=" + test.author + ", permlink=" + test.permlink, () => {
            const rule = new FirstPostRule();

            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: test.author,
                permlink: test.permlink
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
