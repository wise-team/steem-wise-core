// 3rd party imports
import { expect } from "chai";
import "mocha";

// wise imports
import { VotesCountRule, SendVoteorder, ValidationException, Wise } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { FakeWiseFactory } from "./util/FakeWiseFactory";

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/rule-votescount.spec.ts", () => {
    describe("VotesCountRule.validate", function() {
        const testsModes: { mode: VotesCountRule.Mode, value: number; author: string;  permlink: string; pass: boolean } [] = [
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

        testsModes.forEach((test, i: number) => it(
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
    });
});
