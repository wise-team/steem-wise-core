import { expect } from "chai";
import "mocha";

import { Promise } from "bluebird";

import * as filter from "../src/blockchain-filter";
import { RawOperation, CustomJsonOperation } from "../src/blockchain-operations-types";


describe("blockchain-filter", () => {
    describe("getSmartvotesOperationsOfUser", () => {
        let guest123Ops: CustomJsonOperation[];

        before(function(done) {
            this.timeout(10000);
            filter.getSmartvotesOperationsOfUser("guest123", function(error: Error, result: CustomJsonOperation[]) {
                if (error) throw error;

                guest123Ops = result;
                done();
            });
        })

        it("getSmartvotesOperationsOfUser returns at least 7 smartvote operations for user @guest123", () => {
            console.log(guest123Ops);
            expect(guest123Ops.length).to.be.greaterThan(6);
        });
    })

});