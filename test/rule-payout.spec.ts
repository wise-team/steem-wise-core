// 3rd party imports
import { expect } from "chai";
import "mocha";

// wise imports
import { PayoutRule, SendVoteorder, ValidationException, Wise } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";
import { FakeWiseFactory } from "./util/FakeWiseFactory";
import { AccountInfo } from "../src/blockchain/AccountInfo";

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeDataset = FakeWiseFactory.loadDataset();
const fakeApi = FakeWiseFactory.buildFakeApiWithDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/rule-payout.spec.ts", () => {
    describe("PayoutRule.validate", function() {
        const testsModes: { mode: PayoutRule.Mode, value: number; author: string;  permlink: string; pass: boolean } [] = [
            {
                mode: PayoutRule.Mode.EQUAL, author: "steemprojects2", permlink: "sttnc-test",
                value: 0, pass: true
            }, {
                mode: PayoutRule.Mode.EQUAL, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 0, pass: false
            }, {
                mode: PayoutRule.Mode.MORE_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 73, pass: true
            }, {
                mode: PayoutRule.Mode.MORE_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 75, pass: false
            }, {
                mode: PayoutRule.Mode.LESS_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 73, pass: false
            }, {
                mode: PayoutRule.Mode.LESS_THAN, author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                value: 75, pass: true
            },
        ];

        testsModes.forEach((test, i: number) => it(
                "PayoutRule " + ( test.pass ? "should pass" : "should fail" ) + ": " +
                "[" + test.author + ", " + test.permlink + "] " + test.mode + " " + test.value, () => {
            const rule = new PayoutRule(test.mode, test.value);
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

    describe("PayoutRule._parsePayout", function() {
        it("Returns correct floats", () => {
            expect(PayoutRule._parsePayout("0 SBD")).to.be.closeTo(0, 0.0001);
            expect(PayoutRule._parsePayout("0.001 SBD")).to.be.closeTo(0.001, 0.0001);
            expect(PayoutRule._parsePayout("73.054 SBD")).to.be.closeTo(73.054, 0.0001);
            expect(PayoutRule._parsePayout("73.0 SBD")).to.be.closeTo(73, 0.0001);
            expect(PayoutRule._parsePayout("73 SBD")).to.be.closeTo(73, 0.0001);
        });
    });
});
