import { expect } from "chai";
import "mocha";

import SteemSmartvotes from "../src/steem-smartvotes";
import { smartvotes_operation } from "../src/schema/smartvotes.schema";

describe("test/schema-validation.spec.ts", () => {
    const validOp: smartvotes_operation = {
        name: "set_rules",
        rulesets: []
    };

    describe("SteemSmartvotes.validateJSON", () => {
        it("should pass a valid operation", () => {
            expect(SteemSmartvotes.validateJSON(JSON.stringify(validOp))).to.equal(true);
        });

        it("should fail on an invalid command", () => {
            const op = {
                name: "invalid_cmd",
                rulesets: []
            };
            expect(SteemSmartvotes.validateJSON(JSON.stringify(op))).to.equal(false);
        });
    });
});