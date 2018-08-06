// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../src/util/log"; const log = Log.getLogger(); Log.setLevel("info");

// wise imports
import { Validator } from "../src/validation/Validator";
import { Wise, SteemOperationNumber, SendVoteorder, ValidationException } from "../src/wise";
import { FakeApi } from "../src/api/FakeApi";


/* PREPARE TESTING DATASETS */
import * as fakeDataset_ from "./data/fake-blockchain.json";
const fakeDataset = fakeDataset_ as object as FakeApi.Dataset;

/* CONFIG */
const delegator = "noisy";
const voter = "perduta";
const fakeApi: FakeApi = FakeApi.fromDataset(fakeDataset);
const wise = new Wise(voter, fakeApi);


describe("test/validator.spec.ts", () => {
    describe("Validator", () => {
        const validator = new Validator(fakeApi, wise.getProtocol());
        validator.provideRulesets({
            voter: voter,
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
