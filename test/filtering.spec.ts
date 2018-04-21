import { expect } from "chai";
import "mocha";

import * as filter from "../src/blockchain-filter";
import { RawOperation, CustomJsonOperation } from "../src/blockchain-operations-types";
import { smartvotes_operation } from "../src/schema/smartvotes.schema";


describe("blockchain-filter", () => {
    describe("getSmartvotesOperationsOfUser", () => {
        let guest123Ops: smartvotes_operation[];

        before(function(done) {
            this.timeout(10000);
            filter.getSmartvotesOperationsOfUser("guest123", function(error: Error | undefined, result: smartvotes_operation []): void {
                if (error) done(error);

                guest123Ops = result;
                done();
            });
        })

        it("getSmartvotesOperationsOfUser returns at least 7 smartvote operations for user @guest123", () => {
            expect(guest123Ops.length).to.be.greaterThan(6);
        });
    });

});