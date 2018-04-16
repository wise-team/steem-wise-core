import { expect } from "chai";
import "mocha";

import SteemSmartvotes from "../lib/steem-smartvotes";
import { smartvotes_operation } from "../schema/smartvotes.schema";

const validOp: smartvotes_operation = {
    type: "smartvote",
    command: {
        name: "set_rules",
        rulesets: []
    }
};

describe("SteemSmartvotes.validateJSON", () => {
    it("should pass a valid operation", () => {
        expect(SteemSmartvotes.validateJSON(JSON.stringify(validOp))).to.equal(true);
    });

    it("should fail on an invalid operation type", () => {
        const op = Object.assign({}, validOp, {type: "invalid_type"});
        expect(SteemSmartvotes.validateJSON(JSON.stringify(op))).to.equal(false);
    });

    it("should fail on an invalid command", () => {
        const op = Object.assign({}, validOp, {
            command: {
                name: "invalid_cmd"
            }
        });
        expect(SteemSmartvotes.validateJSON(JSON.stringify(op))).to.equal(false);
    });
});