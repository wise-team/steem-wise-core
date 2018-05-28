import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";
import * as fs from "fs";
import * as path from "path";

import { Wise } from "../src/wise";
import { DisabledApi } from "../src/api/DisabledApi";


describe("test/protocol-versions-handling.spec.ts", function() {
    this.timeout(3000);

    describe("Protocol V1", () => {
        const wise = new Wise("", new DisabledApi());
        const protocol = wise.getProtocol();

        const allValidOperations = JSON.parse(fs.readFileSync(__dirname + "/data/operations/v1-valid.operations.json", "UTF-8"));

        it ("Validates all previously valid V1 (smartvote) operations as valid", () => {
            for (const op of allValidOperations) {
                const result = wise.validateSteemOperation(op);
                expect(result).to.be.true;
            }
        });

        const allInvalidOperations = JSON.parse(fs.readFileSync(__dirname + "/data/operations/v1-invalid.operations.json", "UTF-8"));

        it ("Validates all previously invalid V1 (smartvote) operations as valid", () => {
            for (const op of allInvalidOperations) {
                const result = wise.validateSteemOperation(op);
                expect(result).to.be.false;
            }
        });
    });
});
