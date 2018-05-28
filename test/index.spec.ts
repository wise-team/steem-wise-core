import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";

import { DirectBlockchainApi, Wise, SteemOperationNumber } from "../src/wise";

import * as data from "./data/index.data";
import { Mutex } from "./util/Semaphore";


describe("test/index.spec.ts", () => {
    describe("Wise", function() {
        this.timeout(30 * 1000);

        const username = "guest123";
        const postingWif = "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg";
        const wise = new Wise(username, new DirectBlockchainApi(username, postingWif));

        const sendRulesMutex: Mutex = new Mutex();

        describe("#sendRules", () => {
            it("sends valid rules without error", (mochaDone) => {
                sendRulesMutex.acquire().then(releaseMutex => {
                    const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                    wise.sendRules(data.sendRules_valid.voter, data.sendRules_valid.rules, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        if (error) done(error);
                        else {
                            if (result) {
                                if (result && result.blockNum && result.blockNum > 1) done();
                                else done(new Error("#sendRules did not returned valid block number"));
                            }
                            else done(new Error("Inconsistent state: no error and no result"));
                        }
                    });
                });
            });
        });


        describe("#sendVoteorder", () => {
            it("sends valid voteorder", (mochaDone) => {
                sendRulesMutex.acquire().then(releaseMutex => {
                    const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                    wise.sendVoteorder(data.sendVoteorder_valid.delegator, data.sendVoteorder_valid.voteorder, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        if (error) done(error);
                        else {
                            if (result) {
                                if (result && result.blockNum && result.blockNum > 1) done();
                                else done(new Error("#sendVoteorder did not returned valid block number"));
                            }
                            else done(new Error("Inconsistent state: no error and no result"));
                        }
                    });
                });
            });

            it("refuses to send invalid voteorder", (mochaDone) => {
                sendRulesMutex.acquire().then(releaseMutex => {
                    const done = function(err?: any) { mochaDone(err); releaseMutex(); };

                    wise.sendVoteorder(data.sendVoteorder_invalid.delegator, data.sendVoteorder_valid.voteorder, (error: Error | undefined, result: SteemOperationNumber | undefined): void => {
                        if (error) done(error);
                        else {
                            if (result) done();
                            else done(new Error("Inconsistent state: no error and no result"));
                        }
                    });
                });
            });
        });
    });
});
