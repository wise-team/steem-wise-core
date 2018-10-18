// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../../src/util/Log";

// wise imports
import { VotesCountRule, SendVoteorder, ValidationException, Wise } from "../../src/wise";
import { ValidationContext } from "../../src/validation/ValidationContext";
import { FakeWiseFactory } from "../util/FakeWiseFactory";
import { wise_rule_votes_count_encode, wise_rule_votes_count, wise_rule_votes_count_decode } from "../../src/protocol/versions/v2/rules/rule-votes-count-schema";

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/unit/rule-votescount.spec.ts", () => {
    describe("VotesCountRule.validate", function() {
        const tests: { mode: VotesCountRule.Mode, value: number; author: string;  permlink: string; pass: boolean } [] = [
            {
                mode: VotesCountRule.Mode.EQUAL, author: "steemprojects2", permlink: "sttnc-test",
                value: 1, pass: true
            }, {
                mode: VotesCountRule.Mode.EQUAL, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 0, pass: false
            }, {
                mode: VotesCountRule.Mode.MORE_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 139, pass: true
            }, {
                mode: VotesCountRule.Mode.MORE_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 500, pass: false
            }, {
                mode: VotesCountRule.Mode.LESS_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 139, pass: false
            }, {
                mode: VotesCountRule.Mode.LESS_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 500, pass: true
            },
        ];

        tests.forEach((test, i: number) => it(
                "VotesCountRule " + ( test.pass ? "should pass" : "should fail" ) + ": " +
                "[" + test.author + ", " + test.permlink + "] " + test.mode + " " + test.value, () => {
            const rule = new VotesCountRule(test.mode, test.value);
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

        tests.forEach((test, i: number) => it ("is correctly serialized and deserialized by v2", () => {
            const rule = new VotesCountRule(test.mode, test.value);
            const encoded: wise_rule_votes_count = wise_rule_votes_count_encode(rule);

            const decoded: VotesCountRule = wise_rule_votes_count_decode(encoded);
            expect(decoded).to.deep.equal(rule);

            const encoded2: wise_rule_votes_count = wise_rule_votes_count_encode(decoded);
            expect(encoded2).to.deep.equal(encoded);
        }));
    });
});
