// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../../src/util/log";

// wise imports
import { AuthorsRule, SendVoteorder, Wise, ValidationException, TagsRule, Api } from "../../src/wise";
import { ValidationContext } from "../../src/validation/ValidationContext";
import { FakeWiseFactory } from "../util/FakeWiseFactory";
import { VotersRule } from "../../src/rules/VotersRule";
import { wise_rule_voters_decode, wise_rule_voters_encode, wise_rule_voters } from "../../src/protocol/versions/v2/rules/rule-voters-schema";

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeApi: Api = FakeWiseFactory.buildFakeApi();
const wise = new Wise(voter, fakeApi);


describe("test/unit/rule-voters.spec.ts", () => {
    describe("VotersRule", function() {
        const tests = [
            {rule: new VotersRule(VotersRule.Mode.ONE, ["noisy", "jblew", "perduta"]),
                author: "steemprojects2", permlink: "4jxxyd-test",
                pass: true, desc: "all post voters are on the 'one-of' list => pass"},
            {rule: new VotersRule(VotersRule.Mode.ONE, ["albakerki", "gtg", "lukmarcus", "sisters", "andzi76",
            "diosbot", "openart", "informator", "fervi", "jacekw", "mandl", "saunter", "firesteem", "thedragonnis",
            "perduta", "didymos", "santarius", "modemser", "kapitanpolak", "dlivestarbooster", "ines95", "beatle",
            "rlewando", "zwora", "kiselevav", "dww", "niepoprawny", "marten7", "domowir", "theqralos", "rtyminski",
            "bazimir", "marianski", "introbot", "byqov", "kingkong1", "marekkaminski", "jblew", "donkelly", "krasnalek",
            "steemprojects3", "pibyk", "guest123"]), // noisy is missing on the list
                author: "jblew", permlink: "witajcie-steemianie-przybywam-jedrzej-lewandowski",
                pass: false, desc: "only one of the post voters in not on the list => fail"},
            {rule: new VotersRule(VotersRule.Mode.NONE, ["steemprojects2"]),
                author: "jblew", permlink: "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise",
                pass: true, desc: "none of the voters is on the list => pass"},
            {rule: new VotersRule(VotersRule.Mode.NONE, ["noisy"]),
                author: "jblew", permlink: "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise",
                pass: false, desc: "one of the voters is on the list => fail"},
            {rule: new VotersRule(VotersRule.Mode.ANY, ["noisy", "nonexistent-account"]),
                author: "jblew", permlink: "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise",
                pass: true, desc: "only one of the voters is on the list => pass"},
            {rule: new VotersRule(VotersRule.Mode.ANY, ["nonexistent1-account", "nonexistent2-account"]),
                author: "jblew", permlink: "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise",
                pass: false, desc: "none of the voters is on the list => fail"},
            {rule: new VotersRule(VotersRule.Mode.ALL, ["gtg", "noisy", "perduta"]),
                author: "nicniezgrublem", permlink: "b52e6300-9011-11e8-b2de-f7be8f055a16",
                pass: true, desc: "all usernames from the list votes on the post => pass"},
            {rule: new VotersRule(VotersRule.Mode.ALL, ["gtg", "noisy", "perduta", "steemprojects2"]),
                author: "nicniezgrublem", permlink: "b52e6300-9011-11e8-b2de-f7be8f055a16",
                pass: false, desc: "not all usernames from the list votes on the post => fail"},
        ];
        tests.forEach(test => it(test.rule.mode + ": Should " + (test.pass ? "pass" : "fail") + ": " + test.desc, () => {
            const rule = test.rule;
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: test.author, permlink: test.permlink
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context).then(
                () => { if (!test.pass) throw new Error("Should fail"); },
                (error: Error) => {
                    if (test.pass) throw error;
                    else expect((error as ValidationException).validationException).to.be.true;
                 }
            );
        }));

        tests.forEach((test, i: number) => it ("is correctly serialized and deserialized by v2", () => {
            const rule = test.rule;
            const encoded: wise_rule_voters = wise_rule_voters_encode(rule);

            const decoded: VotersRule = wise_rule_voters_decode(encoded);
            expect(decoded).to.deep.equal(rule);

            const encoded2: wise_rule_voters = wise_rule_voters_encode(decoded);
            expect(encoded2).to.deep.equal(encoded);
        }));

        it("throws ValidationException on nonexistent post", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "noisy",
                permlink: "nonexistent-post-" + Date.now()
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context)
            .then(() => { throw new Error("Should fail"); },
                  (e: Error) => { expect((e as ValidationException).validationException).to.be.true; });
        });
    });
});
