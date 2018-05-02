import { expect } from "chai";
import "mocha";

import { BlockchainFilter } from "../src/BlockchainFilter";
import { RawOperation, CustomJsonOperation } from "../src/types/blockchain-operations-types";
import { smartvotes_operation } from "../src/schema/smartvotes.schema";

describe("test/blockchain-filtering.spec.ts", () => {
    describe("getSmartvotesOperationsOfUser", () => {
        let guest123Ops: smartvotes_operation[];

        before(function(done) {
            this.timeout(25000); // guest123 has many operations (it takes at least 13 batch requests)
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

        it("loads operations in correct order (from newest to oldest)", () => {
            const olderUpvotedPostPermlink = "how-to-configure-steemconnect-v2-and-use-it-with-your-application-how-it-works-and-how-it-is-different-from-v1";
            const newerUpvotedPostPermlink = "ann-introducing-steemprojects-com-information-about-all-steem-projects-in-one-place";
            const newstUpvotedPostPermlink = "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video";
            let olderOpIndex: number = 0;
            let newerOpIndex: number = 0;
            let newestOpIndex: number = 0;

            for (let i = 0; i < guest123Ops.length; i++) {
                const op = guest123Ops[i];

                if (op.name === "send_voteorder" && op.voteorder.permlink === olderUpvotedPostPermlink) {
                    olderOpIndex = i;
                }
                else if (op.name === "send_voteorder" && op.voteorder.permlink === newerUpvotedPostPermlink) {
                    newerOpIndex = i;
                }
                else if (op.name === "send_voteorder" && op.voteorder.permlink === newstUpvotedPostPermlink) {
                    newestOpIndex = i;
                }
            }

            expect(newerOpIndex).to.be.greaterThan(newestOpIndex);
            expect(olderOpIndex).to.be.greaterThan(newerOpIndex);
            expect(olderOpIndex).to.be.greaterThan(newestOpIndex);
        });
    });

    describe("getOperationsBeforeDate", () => {
        let guest123Ops: smartvotes_operation[];

        before(function(done) {
            this.timeout(25000); // guest123 has many operations (it takes at least 13 batch requests)
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