// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../../src/util/log";

// wise imports
import { AuthorsRule, SendVoteorder, Wise, ValidationException, TagsRule, Api } from "../../src/wise";
import { ValidationContext } from "../../src/validation/ValidationContext";
import { FakeWiseFactory } from "../util/FakeWiseFactory";


describe("test/unit/rule-tags.spec.ts", () => {
    const delegator = "noisy";
    const voter = "perduta";
    let fakeApi: Api;
    let wise: Wise;

    before(() => {
        fakeApi = FakeWiseFactory.buildFakeApi();
        wise = new Wise(voter, fakeApi);
    });

    describe("TagsRule", function() {
        const tests = [
            { rule: new TagsRule(TagsRule.Mode.ALLOW, ["steemprojects", "steemdev", "suggestion", "input", "busy", "esteem", "nonexistenttag"]),
                author: "cryptoctopus", permlink: "steemprojects-com-a-project-we-should-all-care-about-suggestions",
                pass: true, desc: "has all tags from allow list => pass" },
            { rule: new TagsRule(TagsRule.Mode.ALLOW, ["steemprojects", "steemdev", "suggestion", "input", "busy", "esteem", "nonexistenttag"]),
                author: "nmax83", permlink: "steemprojects-com-sebuah-proyek-yang-seharusnya-kita-semua-peduli-tentang-saran-e78b56ef99562",
                pass: false, desc: "only one of the post tags in not on the list => fail"},
            { rule: new TagsRule(TagsRule.Mode.DENY, ["steemprojects"]),
                author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: false, desc: "has on tag from the list => fail" },
            { rule: new TagsRule(TagsRule.Mode.DENY, ["steemprojects"]),
                author: "perduta", permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: true, desc: "has no tags from the list => pass" },
            {  rule: new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects", "review"]),
                author: "perduta", permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: false, desc: "it does not have any of the required tags => fail" },
            { rule: new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects", "review"]),
                author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: false, desc: "it has only one of the required tags => fail" },
            { rule: new TagsRule(TagsRule.Mode.REQUIRE, ["steemprojects", "review"]),
                author: "phgnomo", permlink: "steem-project-of-the-week-1-get-on-steem",
                pass: true, desc: "it has both of the required tags => pass" },
            { rule: new TagsRule(TagsRule.Mode.ANY, ["steemprojects", "review"]),
                author: "phgnomo", permlink: "steem-project-of-the-week-1-get-on-steem",
                pass: true, desc: "it has both of the required tags => pass" },
            { rule: new TagsRule(TagsRule.Mode.ANY, ["steemprojects", "review"]),
                author: "noisy", permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
                pass: true, desc: "it has only one of the required tags => pass" },
            { rule: new TagsRule(TagsRule.Mode.ANY, ["steemprojects", "review"]),
                author: "tanata", permlink: "man-of-steel",
                pass: true, desc: "it has only one of the required tags => pass" },
            { rule: new TagsRule(TagsRule.Mode.ANY, ["steemprojects", "review"]),
                author: "perduta", permlink: "game-that-i-fall-in-love-with-as-developer",
                pass: false, desc: "it has no one of the required tags => fail" }
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
