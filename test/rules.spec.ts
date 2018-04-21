import { expect } from "chai";
import "mocha";
import { Mutex } from "./Semaphore";

import { RulesValidator } from "../src/RulesValidator";
import { smartvotes_rule, smartvotes_ruleset } from "../src/schema/rules.schema";
import SteemSmartvotes from "../src/steem-smartvotes";
import {smartvotes_vote_weight, smartvotes_voteorder} from "../src/schema/votes.schema";


describe("rules", () => {
    const sequentialMutex: Mutex = new Mutex();
        it("SteemSmartvotes.sendRulesets sends rules without an error", function (mochaDone) {
            sequentialMutex.acquire().then(releaseMutex => {
                const done = function(err?: any) { mochaDone(err); releaseMutex(); }

                this.timeout(10000);

                const ruleset1: smartvotes_ruleset = {
                    name: "Curator of tag #smartvotes",
                    voter: "steemprojects1",
                    total_weight: 20000,
                    action: "upvote+flag",
                    rules: [
                        {
                            type: "tags",
                            mode: "allow",
                            tags: ["smartvotes"]
                        }
                    ]
                };

                const ruleset2: smartvotes_ruleset = {
                    name: "Punish bad content by @nonexistentuser1 and @nonexistentuser2 on tags #tag1 and #tag2.",
                    voter: "steemprojects1",
                    total_weight: 20000,
                    action: "flag",
                    rules: [
                        {
                            type: "tags",
                            mode: "allow",
                            tags: ["tag1", "tag2"]
                        },
                        {
                            type: "authors",
                            mode: "allow",
                            authors: ["nonexistentuser1", "nonexistentuser2"]
                        }
                    ]
                };

                const smartvotes = new SteemSmartvotes("guest123",
                    "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg");
                smartvotes.sendRulesets([ruleset1, ruleset2], function (error: Error) {
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
                const done = function (err?: any) { mochaDone(err); releaseMutex(); }
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
                const done = function (err?: any) { mochaDone(err); releaseMutex(); }
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
                    else done("Should throw error on nonexistent ruleset");
                });
            });
        });

        it("#validateVoteOrder fails on empty voteorder", function (mochaDone) {
            sequentialMutex.acquire().then(releaseMutex => {
                const done = function (err?: any) { mochaDone(err); releaseMutex(); }
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