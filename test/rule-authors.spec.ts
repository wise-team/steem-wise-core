import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";
import * as _ from "lodash";

import { AuthorsRule, SendVoteorder, Wise, ValidationException, TagsRule, WeightRule, CustomRPCRule } from "../src/wise";
import { ValidationContext } from "../src/validation/ValidationContext";

import { FakeApi } from "../src/api/FakeApi";
import * as fakeDataset_ from "./data/fake-blockchain.json";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

const delegator = "noisy";
const voter = "perduta";
const fakeApi: FakeApi = FakeApi.fromDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);

describe("test/rule-authors.spec.ts", () => {
    describe("AuthorsRule", function() {
        it("AllowMode: passes allowed author", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.ALLOW, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "noisy",
                permlink: "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context);
        });

        it("AllowMode: throws ValidationException on different author", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.ALLOW, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "pojan",
                permlink: "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context)
            .then(() => { throw new Error("Should fail"); },
                  (e: Error) => { expect((e as ValidationException).validationException).to.be.true; });
        });

        it("DenyMode: passes on author that is not on the list", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "pojan",
                permlink: "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context);
        });

        it("DenyMode: throws ValidationException on author from the list", () => {
            const rule = new AuthorsRule(AuthorsRule.Mode.DENY, ["noisy", "perduta"]);
            const voteorder: SendVoteorder = {
                rulesetName: "", weight: 1,
                author: "noisy",
                permlink: "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that"
            };
            const context = new ValidationContext(fakeApi, delegator, voter, voteorder);
            return rule.validate(voteorder, context)
            .then(() => { throw new Error("Should fail"); },
                  (e: Error) => { expect((e as ValidationException).validationException).to.be.true; });
        });

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
