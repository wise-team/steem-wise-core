import { expect } from "chai";
import "mocha";

import { smartvotes_operation } from "../src/schema/smartvotes.schema";
import SteemSmartvotes from "../src/steem-smartvotes";
import { smartvotes_vote_weight, smartvotes_voteorder } from "../src/schema/votes.schema";

describe("test/voteorder-sending.spec.ts", () => {
    describe("SteemSmartvotes", () => {
        describe("sendVoteOrder", () => {
            it("sends valid vote order without error", function (done) {
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

                sm.sendVoteOrder(order, function (error: Error | undefined, result: any) {
                    if (error) done(error);
                    else done();
                });
            });

            it("does not send invalid voteorder", function (done) {
                this.timeout(20000);
                const sm: SteemSmartvotes = new SteemSmartvotes("guest123",
                    "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg");

                const order: smartvotes_voteorder = {
                    ruleset_name: "Upvote, allow author @noisy",
                    author: "noisy",
                    permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
                    delegator: "steemprojects1",
                    weight: 10000, // too high weight
                    type: "upvote"
                };

                sm.sendVoteOrder(order, function (error: Error | undefined, result: any) {
                    if (error) done();
                    else done(new Error("Should fail on invalid voteorder"));
                });
            });
        });
    });
});