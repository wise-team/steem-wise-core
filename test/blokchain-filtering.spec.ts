import { expect } from "chai";
import "mocha";

import { BlockchainFilter } from "../src/BlockchainFilter";
import { RawOperation, CustomJsonOperation } from "../src/types/blockchain-operations-types";
import { smartvotes_operation } from "../src/schema/smartvotes.schema";

describe("test/blockchain-filtering.spec.ts", () => {
    describe("blockchain-filter", () => {
        describe("getSmartvotesOperationsOfUser", () => {
            let guest123Ops: smartvotes_operation[];

            before(function(done) {
                this.timeout(20000);
                BlockchainFilter.getSmartvotesOperationsOfUser("guest123", function(error: Error | undefined, result: smartvotes_operation []): void {
                    if (error) done(error);
                    else {
                        guest123Ops = result;
                        done();
                    }
                });
            });

            it("returns at least 7 smartvote operations for user @guest123", () => {
                expect(guest123Ops.length).to.be.greaterThan(6);
            });
        });

        describe("getOperationsBeforeDate", () => {
            let guest123Ops: smartvotes_operation[];

            before(function(done) {
                this.timeout(20000);
                BlockchainFilter.getSmartvotesOperationsBeforeDate("guest123",  ["set_rules"], -1, new Date("2018-04-21 13:00"), function(error: Error | undefined, result: smartvotes_operation []): void {
                    if (error) done(error);
                    else {
                        guest123Ops = result;
                        done();
                    }
                });
            });

            it("returns three set_rules operation before 2018-04-21 13:00 for user @guest123", () => {
                expect(guest123Ops.length).to.be.equal(3);
            });
        });

        describe("loadPost", () => {
            let post: any;

            before(function(done) {
                this.timeout(10000);
                BlockchainFilter.loadPost("steemit",  "firstpost", function(error: Error | undefined, result: any): void {
                    if (error) done(error);

                    post = result;
                    done();
                });
            });

            it("loads first steemit post without error and with correct content", () => {
                expect(post.author).to.be.equal("steemit");
                expect(post.permlink).to.be.equal("firstpost");
                expect(post.title).to.be.equal("Welcome to Steem!");
            });
        });
    });
});