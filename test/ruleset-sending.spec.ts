import { expect } from "chai";
import "mocha";
import { Mutex } from "./util/Semaphore";

import { RulesValidator } from "../src/validation/RulesValidator";
import { smartvotes_rule, smartvotes_ruleset } from "../src/schema/rules.schema";
import SteemSmartvotes from "../src/steem-smartvotes";
import { smartvotes_vote_weight, smartvotes_voteorder } from "../src/schema/votes.schema";

import { testRulesets } from "./data/rulesets-test-data";

describe("test/ruleset-sending.spec.ts", () => {
    const sequentialMutex: Mutex = new Mutex();
        it("SteemSmartvotes.sendRulesets sends rules without an error", function (mochaDone) {
            sequentialMutex.acquire().then(releaseMutex => {
                const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                this.timeout(10000);

                const smartvotes = new SteemSmartvotes("guest123",
                    "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg");
                smartvotes.sendRulesets(testRulesets, function (error: Error) {
                    releaseMutex();
                    if (error) {
                        done(error);
                    }
                    else done();
                });
            });
        });

    describe("RulesValidator", () => {
        it("#getRulesOfUser returns at leas two rulesets for user guest123", function (mochaDone) {
            sequentialMutex.acquire().then(releaseMutex => {
                const done = function (err?: any) { mochaDone(err); releaseMutex(); };
                this.timeout(10000);

                RulesValidator.getRulesOfUser("guest123", new Date(), function (error: Error | undefined, result: smartvotes_ruleset []): void {
                    if (error) done(error);
                    else {
                        if (result.length >= 2) {
                            done();
                        }
                        else done(new Error("Too few rulesets for guest123"));
                    }
                });
            });
        });

        it("#validateVoteOrder fails on nonexistent ruleset", function (mochaDone) {
            sequentialMutex.acquire().then(releaseMutex => {
                const done = function (err?: any) { mochaDone(err); releaseMutex(); };
                this.timeout(10000);

                RulesValidator.validateVoteOrder("guest123", {
                    ruleset_name: "nonexistent_ruleset",
                    author: "steemit",
                    permlink: "firstpost",
                    delegator: "steemprojects1",
                    weight: 10,
                    type: "upvote"
                }, new Date(), function(error: Error|undefined, result: boolean) {
                    if (error) {
                        done();
                    }
                    else done(new Error("Should throw error on nonexistent ruleset"));
                });
            });
        });

        it("#validateVoteOrder fails on empty voteorder", function (mochaDone) {
            sequentialMutex.acquire().then(releaseMutex => {
                const done = function (err?: any) { mochaDone(err); releaseMutex(); };
                this.timeout(10000);

                RulesValidator.getRulesOfUser("guest123", new Date(), function (error: Error | undefined, result: smartvotes_ruleset []): void {
                    if (error) done(error);
                    else {
                        if (result.length >= 2) {
                            done();
                        }
                        else done(new Error("Too few rulesets for guest123"));
                    }
                });
            });
        });
    });
});