// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../../src/log/log";

// wise imports
import { Validator } from "../../src/validation/Validator";
import { Wise, SteemOperationNumber, SendVoteorder, ValidationException, Api } from "../../src/wise";
import { FakeApi } from "../../src/api/FakeApi";
import { FakeWiseFactory } from "../util/FakeWiseFactory";


/* PREPARE TESTING DATASETS */
const fakeDataset = FakeWiseFactory.loadDataset();

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeApi: FakeApi = FakeApi.fromDataset(Wise.constructDefaultProtocol(), fakeDataset);
const wise = new Wise(voter, fakeApi as any as Api);


describe("test/unit/validator.spec.ts", () => {
    describe("Validator", () => {
        const validator = new Validator(fakeApi as any as Api);
        validator.provideRulesets({
            voter: voter,
            delegator: delegator,
            moment: new SteemOperationNumber(0, 0, 0),
            rulesets: [{ name: "ruleset", rules: [] }]
        });

        it("allows weight=0", () => {
            const vo: SendVoteorder = {
                rulesetName: "ruleset",
                weight: 0,
                author: "nonexistent",
                permlink: "nonexistent"
            };
            return validator.validate(delegator, voter, vo, SteemOperationNumber.FUTURE)
            .then((result: ValidationException | true) => expect(result).to.deep.equal(true));
        });

        it("allows weight=10000", () => {
            const vo: SendVoteorder = {
                rulesetName: "ruleset",
                weight: 10000,
                author: "nonexistent",
                permlink: "nonexistent"
            };
            return validator.validate(delegator, voter, vo, SteemOperationNumber.FUTURE)
            .then((result: ValidationException | true) => expect(result).to.deep.equal(true));
        });

        it("allows weight=-10000", () => {
            const vo: SendVoteorder = {
                rulesetName: "ruleset",
                weight: -10000,
                author: "nonexistent",
                permlink: "nonexistent"
            };
            return validator.validate(delegator, voter, vo, SteemOperationNumber.FUTURE)
            .then((result: ValidationException | true) => expect(result).to.deep.equal(true));
        });
    });
});
