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

    describe("getOperationsBeforeDate", () => {
        let guest123Ops: smartvotes_operation[];

        before(function(done) {
            this.timeout(10000);
            filter.getOperationsBeforeDate("guest123",  ["set_rules"], -1, new Date("2018-04-21 13:00"), function(error: Error | undefined, result: smartvotes_operation []): void {
                if (error) done(error);

                guest123Ops = result;
                done();
            });
        })

        it("getOperationsBeforeDate returns three set_rules operation before 2018-04-21 13:00 for user @guest123", () => {
            expect(guest123Ops.length).to.be.equal(3);
        });
    });
});