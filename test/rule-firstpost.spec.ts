// 3rd party imports
import { expect } from "chai";
import "mocha";
import * as _log from "loglevel"; const log = _log.getLogger("steem-wise-core");
log.setLevel(log.levels.INFO);

// wise imports
import { FirstPostRule, SendVoteorder, ValidationException, Wise } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { FakeWiseFactory } from "./util/FakeWiseFactory";
import { wise_rule_first_post_encode, wise_rule_first_post_decode, wise_rule_first_post } from "../src/protocol/versions/v2/rules/rule-first-post-schema";

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

        it ("is correctly serialized and deserialized by v2", () => {
            const rule = new FirstPostRule();
            const encoded: wise_rule_first_post = wise_rule_first_post_encode(rule);

            const decoded: FirstPostRule = wise_rule_first_post_decode(encoded);
            expect(decoded).to.deep.equal(rule);

            const encoded2: wise_rule_first_post = wise_rule_first_post_encode(decoded);
            expect(encoded2).to.deep.equal(encoded);
        });
    });
});
