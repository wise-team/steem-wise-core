// 3rd party imports
import "mocha";
import * as _ from "lodash";
import { Log } from "../../src/util/log";

// wise imports
import { SendVoteorder, Wise, WeightRule, Api } from "../../src/wise";
import { ValidationContext } from "../../src/validation/ValidationContext";
import { FakeApi } from "../../src/api/FakeApi";
import { FakeWiseFactory } from "../util/FakeWiseFactory";

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeApi: Api = FakeWiseFactory.buildFakeApi();
const wise = new Wise(voter, fakeApi);


describe("test/unit/rule-weight.spec.ts", () => {
    describe("WeightRule", () => {
        const voteorder: SendVoteorder = {
            rulesetName: "",
            weight: 1,
            author: "noisy",
            permlink: "nonexistent-post-" + Date.now()
        };
        const context = new ValidationContext(fakeApi, wise.getProtocol(), delegator, voter, voteorder);

        it ("allows 0 <= 50 <= 100", () => {
            const rule = new WeightRule(0, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", 50);
            return rule.validate(vo, context);
        });

        it ("allows 0 <= 0 <= 100", () => {
            const rule = new WeightRule(0, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
            return rule.validate(vo, context);
        });

        it ("allows 0 <= 100 <= 100", () => {
            const rule = new WeightRule(0, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
            return rule.validate(vo, context);
        });

        it ("allows -100 <= 0 <= 100", () => {
            const rule = new WeightRule(-100, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
            return rule.validate(vo, context);
        });

        it ("allows -100 <= -100 <= 100", () => {
            const rule = new WeightRule(-100, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", -100);
            return rule.validate(vo, context);
        });

        it ("rejects -100 <= -101 <= 100", () => {
            const rule = new WeightRule(-100, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", -101);
            return rule.validate(vo, context)
            .then(() => { throw new Error("Should fail"); }, () => {});
        });

        it ("rejects -100 <= 101 <= 100", () => {
            const rule = new WeightRule(-100, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", 101);
            return rule.validate(vo, context)
            .then(() => { throw new Error("Should fail"); }, () => {});
        });

        it ("rejects 10 <= 0 <= 100", () => {
            const rule = new WeightRule(10, 100);
            const vo = _.set(_.cloneDeep(voteorder), "weight", 0);
            return rule.validate(vo, context)
            .then(() => { throw new Error("Should fail"); }, () => {});
        });
    });
});
