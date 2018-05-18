import "mocha";
import { expect } from "chai";
import { Mutex } from "./util/Semaphore";

import * as steem from "steem";

import { RulesValidator } from "../src/validation/RulesValidator";
import { smartvotes_rule, smartvotes_ruleset } from "../src/schema/rules.schema";
import { smartvotes_vote_weight, smartvotes_voteorder } from "../src/schema/votes.schema";
import { SteemOperationNumber } from "../src/blockchain/SteemOperationNumber";
import SteemSmartvotes from "../src/steem-smartvotes";

import { testRulesets } from "./data/rulesets-test-data";
import { ApiFactory } from "../src/api/ApiFactory";
import { SteemJsApiFactory } from "../src/api/SteemJsApiFactory";


describe("test/ruleset-sending.spec.ts", () => {
    const apiFactories: ApiFactory [] = [
        new SteemJsApiFactory(1000),
    ];
    for (const apiFactory of apiFactories) {
        describe("Synchronizer — apiFactory = " + apiFactory.getName(), () => {
            const sequentialMutex: Mutex = new Mutex();
            describe("SteemSmartvotes.sendRulesets", function() {
                it("sends valid rules without an error", function (mochaDone) {
                    sequentialMutex.acquire().then(releaseMutex => {
                        const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                        this.timeout(10000);

                        const smartvotes = new SteemSmartvotes("guest123",
                            "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg");
                        smartvotes.sendRulesets(testRulesets, function (error: Error | undefined) {
                            releaseMutex();
                            if (error) {
                                done(error);
                            }
                            else done();
                        });
                    });
                });
            });

            describe("RulesValidator", () => {
                // TODO move test
                it("#getRulesOfUser returns at leas two rulesets for user guest123", function (mochaDone) {
                    sequentialMutex.acquire().then(releaseMutex => {
                        const done = function (err?: any) { mochaDone(err); releaseMutex(); };
                        this.timeout(10000);

                        new RulesValidator(steem, apiFactory).getRulesOfUser("guest123")
                        .then((result: smartvotes_ruleset []): void => {
                            if (result.length >= 2) {
                                done();
                            }
                            else done(new Error("Too few rulesets for guest123"));
                        })
                        .catch((error: Error) => done(error));
                    });
                });

                it("#validateVoteOrder fails on nonexistent ruleset", function (mochaDone) {
                    sequentialMutex.acquire().then(releaseMutex => {
                        const done = function (err?: any) { mochaDone(err); releaseMutex(); };
                        this.timeout(10000);

                        new RulesValidator(steem, apiFactory).validateVoteOrder("guest123", {
                            ruleset_name: "nonexistent_ruleset",
                            author: "steemit",
                            permlink: "firstpost",
                            delegator: "steemprojects1",
                            weight: 10,
                            type: "upvote"
                        }, SteemOperationNumber.FUTURE, function(error: Error|undefined, result: boolean) {
                            if (error) {
                                done();
                            }
                            else done(new Error("Should throw error on nonexistent ruleset"));
                        });
                    });
                });

                it("#getRulesOfUser does not finish silently, but returns empty list", function (done) {
                    this.timeout(10000);

                    new RulesValidator(steem, apiFactory).getRulesOfUser("steemprojects2", new SteemOperationNumber(22144254, 42, 0))
                    .then((result: smartvotes_ruleset []): void => {
                        if (result.length > 0) {
                            done(new Error("Should return empty list"));
                        }
                        else {
                            done();
                        }
                    })
                    .catch((error: Error) => done(error));
                });
            });

            // TODO add test: invalid post fails to send
        });
    }
});