import { expect } from "chai";
import "mocha";

import { smartvotes_operation } from "../src/schema/smartvotes.schema";
import SteemSmartvotes from "../src/steem-smartvotes";
import { smartvotes_vote_weight, smartvotes_voteorder } from "../src/schema/votes.schema";

describe("test/voteorder-sending.spec.ts", () => {
    describe("SteemSmartvotes", () => {
        describe("sendVoteOrder", () => {
            it("sends vote order without error", function (done) {
                this.timeout(20000);
                const sm: SteemSmartvotes = new SteemSmartvotes("guest123",
                    "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg");

                const order: smartvotes_voteorder = {
                    ruleset_name: "Upvote, allow author @noisy",
                    author: "noisy",
                    permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
                    delegator: "steemprojects1",
                    weight: 1,
                    type: "upvote"
                };

                sm.sendVoteOrder(order, function (error: Error, result: any) {
                    if (error) done(error);
                    else done();
                });
            });


            /*
            let guest123Ops: smartvotes_operation[];

            before(function(done) {
                this.timeout(10000);
                filter.getSmartvotesOperationsOfUser("guest123", function(error: Error, result: smartvotes_operation []) {
                    if (error) throw error;

                    guest123Ops = result;
                    done();
                });
            })

            it("getSmartvotesOperationsOfUser returns at least 7 smartvote operations for user @guest123", () => {
                console.log(guest123Ops);
                expect(guest123Ops.length).to.be.greaterThan(6);
            });*/
        });
    });
});