import { expect } from "chai";
import "mocha";
import { Promise } from "bluebird";
import * as steem from "steem";

import { RawOperation, CustomJsonOperation, VoteOperation } from "../src/blockchain/blockchain-operations-types";
import { Chainable, SmartvotesFilter, ChainableLimiter, SimpleTaker, OperationTypeFilter, OperationNumberFilter } from "../src/chainable/_exports";
import { SteemSmartvotes, SteemOperationNumber } from "../src/steem-smartvotes";
import { Synchronizer, SynchronizationResult } from "../src/blockchain/Synchronizer";
import { VoteorderAtMoment, RulesetsAtMoment, VoteConfirmedAtMoment } from "../src/validation/smartvote-types-at-moment";

import * as sequence from "./data/synchronization-testing-sequence";
import { ApiFactory } from "../src/api/ApiFactory";
import { SteemJsApiFactory } from "../src/api/SteemJsApiFactory";

/**
 * In this suite:
 * delegator=@steemprojects2
 * voter=@steemprojects1
 */

describe("test/synchronization.spec.ts", () => {
    const apiFactories: ApiFactory [] = [
        new SteemJsApiFactory(1000),
    ];
    for (const apiFactory of apiFactories) {
        describe("Synchronizer — apiFactory = " + apiFactory.getName(), () => {
            describe("Synchronizer — stage 1 testing", () => {
                let syncResult: SynchronizationResult;
                before(function(done) {
                    this.timeout(35000);
                    const synchronizer = new Synchronizer(steem, apiFactory, "steemprojects2", "-");
                    // synchronizer.withProggressCallback((msg, proggress) => console.log("Proggress: " + msg));
                    synchronizer.atMoment(sequence.stage1_2_SyncConfirmationMoment);
                    synchronizer.validateOnly(true);
                    synchronizer.synchronize((error: Error | undefined, result: SynchronizationResult | undefined) => {
                        if (error) done(error);
                        else {
                            if (result) {
                                syncResult = result;
                                done();
                            }
                            else {
                                done(new Error("No results returned"));
                            }
                        }
                    });
                });

                it("loads 3 sets of ruleset", () => {
                    expect(syncResult.rulesAtMoment.length).to.be.equal(3);
                    expect(syncResult.rulesAtMoment[0].opNum.isEqual_solveOpInTrxBug(new SteemOperationNumber(22144254, 42, 0))).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[1].opNum.isEqual_solveOpInTrxBug(new SteemOperationNumber(22173010, 23, 0))).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[2].opNum.isEqual_solveOpInTrxBug(sequence.stage1_0_Rulesets.opNum)).to.be.equal(true);
                });

                it("calculates correct validity until", () => {
                    expect(syncResult.rulesAtMoment[0].validityUntil.isEqual_solveOpInTrxBug(new SteemOperationNumber(22173010, 23, 0))).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[1].validityUntil.isEqual_solveOpInTrxBug(sequence.stage1_0_Rulesets.opNum)).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[2].validityUntil.isEqual_solveOpInTrxBug(SteemOperationNumber.FUTURE)).to.be.equal(true);
                });

                it("loads no vote confirmations", () => { // synchronization is performed at stage1_2_SyncConfirmationMoment moment.
                    expect(syncResult.confirmedVotes.length).to.be.equal(0);
                });

                it("validates proper voteorders as valid", () => {
                    expect(syncResult.validVoteorders.length).to.be.equal(sequence.stage1_1_ValidVoteorders.length);
                    for (let i = 0; i < sequence.stage1_1_ValidVoteorders.length; i++) {
                        expect(syncResult.validVoteorders[i].transactionId).to.be.equal(sequence.stage1_1_ValidVoteorders[i].transactionId);
                        expect(syncResult.validVoteorders[i].opNum.isEqual_solveOpInTrxBug(sequence.stage1_1_ValidVoteorders[i].opNum)).to.be.equal(true);
                    }
                });

                it("validates previous artifactory voteorders as invalid", () => {
                    expect(syncResult.invalidVoteorders.length).to.be.equal(sequence.previousArtifactoryInvalidVoteorders.length + sequence.stage1_1_InvalidVoteorders.length);
                    for (let i = 0; i < sequence.previousArtifactoryInvalidVoteorders.length; i++) {
                        const vo = sequence.previousArtifactoryInvalidVoteorders[i];
                        expect(syncResult.invalidVoteorders[i][0].opNum.isEqual_solveOpInTrxBug(vo.opNum)).to.be.equal(true);
                        expect(syncResult.invalidVoteorders[i][0].transactionId).to.be.equal(vo.transactionId);
                        expect(syncResult.invalidVoteorders[i][0].voter).to.be.equal(vo.voter);
                        expect(syncResult.invalidVoteorders[i][0].voteorder.permlink).to.be.equal(vo.voteorder.permlink);
                        expect(syncResult.invalidVoteorders[i][0].voteorder.ruleset_name).to.be.equal(vo.voteorder.ruleset_name);
                    }
                });

                it("validates new invalid voteorders as invalid", () => {
                    expect(syncResult.invalidVoteorders.length).to.be.equal(sequence.previousArtifactoryInvalidVoteorders.length + sequence.stage1_1_InvalidVoteorders.length);
                    for (let i = 0; i < sequence.stage1_1_InvalidVoteorders.length; i++) {
                        const correctedI = i + sequence.previousArtifactoryInvalidVoteorders.length;
                        const vo = sequence.stage1_1_InvalidVoteorders[i];
                        expect(syncResult.invalidVoteorders[correctedI][0].opNum.isEqual_solveOpInTrxBug(vo.opNum)).to.be.equal(true);
                        expect(syncResult.invalidVoteorders[correctedI][0].transactionId).to.be.equal(vo.transactionId);
                        expect(syncResult.invalidVoteorders[correctedI][0].voter).to.be.equal(vo.voter);
                        expect(syncResult.invalidVoteorders[correctedI][0].voteorder.permlink).to.be.equal(vo.voteorder.permlink);
                        expect(syncResult.invalidVoteorders[correctedI][0].voteorder.ruleset_name).to.be.equal(vo.voteorder.ruleset_name);
                    }
                });
            });

            describe("Synchronizer — stage 2 testing", () => {
                let syncResult: SynchronizationResult;
                before(function(done) {
                    this.timeout(35000);
                    const synchronizer = new Synchronizer(steem, apiFactory, "steemprojects2", "-");
                    // synchronizer.withProggressCallback((msg, proggress) => console.log("Proggress: " + msg));
                    synchronizer.atMoment(sequence.stage2_3_VoteordersSentMoment);
                    synchronizer.validateOnly(true);
                    synchronizer.synchronize((error: Error | undefined, result: SynchronizationResult | undefined) => {
                        if (error) done(error);
                        else {
                            if (result) {
                                syncResult = result;
                                done();
                            }
                            else {
                                done(new Error("No results returned"));
                            }
                        }
                    });
                });

                it("loads last rules before confirmation, unconfirmed mistaken rules and unconfirmed stage2 rules", () => {
                    expect(syncResult.rulesAtMoment.length).to.be.equal(3);
                    expect(syncResult.rulesAtMoment[0].opNum.isEqual_solveOpInTrxBug(sequence.stage1_0_Rulesets.opNum)).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[1].opNum.isEqual_solveOpInTrxBug(sequence.stage2_0_MistakenRulesetsOpNum)).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[2].opNum.isEqual_solveOpInTrxBug(sequence.stage2_1_Rulesets.opNum)).to.be.equal(true);
                });

                it("calculates correct validity until", () => {
                    expect(syncResult.rulesAtMoment[0].validityUntil.isEqual_solveOpInTrxBug(sequence.stage2_0_MistakenRulesetsOpNum)).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[1].validityUntil.isEqual_solveOpInTrxBug(sequence.stage2_1_Rulesets.opNum)).to.be.equal(true);
                    expect(syncResult.rulesAtMoment[2].validityUntil.isEqual_solveOpInTrxBug(SteemOperationNumber.FUTURE)).to.be.equal(true);
                });

                it("marks (in single transaction) last valid voteorders (the ones from previous stage) as confirmed", () => {
                    expect(syncResult.confirmedVotes.length).to.be.equal(sequence.stage1_1_ValidVoteorders.length);

                    // at that time there was a bug: voteorders were confirmed in reverse order
                    expect(syncResult.confirmedVotes[0].opNum.isEqual_solveOpInTrxBug(sequence.stage1_2_SyncConfirmationMoment)).to.be.equal(true);
                    expect(syncResult.confirmedVotes[0].voteorderTransactionId).to.be.equal(sequence.stage1_1_ValidVoteorders[1].transactionId);
                    expect(syncResult.confirmedVotes[1].voteorderTransactionId).to.be.equal(sequence.stage1_1_ValidVoteorders[0].transactionId);
                });

                it("marks as invalid only invalid voteorders from stage 2 mistaken and invalid lists", () => {
                    expect(syncResult.invalidVoteorders.length).to.be.equal(sequence.stage2_0_MistakenVoteordersTransactionIds.length + sequence.stage2_2_InvalidVoteorders.length);
                });

                it("marks correctly invalid voteorders from stage 2 mistaken list", () => {
                    for (let i = 0; i < sequence.stage2_0_MistakenVoteordersTransactionIds.length; i++) {
                        expect(syncResult.invalidVoteorders[i][0].transactionId).to.be.equal(sequence.stage2_0_MistakenVoteordersTransactionIds[i]);
                    }
                });

                it("marks correctly stage 2 invalid voteorders", () => {
                    for (let i = 0; i < sequence.stage2_2_InvalidVoteorders.length; i++) {
                        const correctedI = i + sequence.stage2_0_MistakenVoteordersTransactionIds.length;
                        expect(syncResult.invalidVoteorders[correctedI][0].transactionId).to.be.equal(sequence.stage2_2_InvalidVoteorders[i].transactionId);
                    }
                });

                it("marks as valid only stage 2 valid voteorders", () => {
                    expect(syncResult.validVoteorders.length).to.be.equal(sequence.stage2_2_ValidVoteorders.length);
                });

                it("marks correctly stage 2 valid voteorders", () => {
                    for (let i = 0; i < sequence.stage2_2_ValidVoteorders.length; i++) {
                        expect(syncResult.validVoteorders[i].transactionId).to.be.equal(sequence.stage2_2_ValidVoteorders[i].transactionId);
                        expect(syncResult.validVoteorders[i].voter).to.be.equal(sequence.stage2_2_ValidVoteorders[i].voter);
                        expect(syncResult.validVoteorders[i].voteorder.ruleset_name).to.be.equal(sequence.stage2_2_ValidVoteorders[i].voteorder.ruleset_name);
                        expect(syncResult.validVoteorders[i].voteorder.permlink).to.be.equal(sequence.stage2_2_ValidVoteorders[i].voteorder.permlink);
                    }
                });
            });

            describe("Synchronizer — stage 3 testing", () => {
                it("returns no voteorders after successful synchronization is done", function(done) {
                    this.timeout(35000);
                    const synchronizer = new Synchronizer(steem, apiFactory, "steemprojects2", "-");
                    // synchronizer.withProggressCallback((msg, proggress) => console.log("Proggress: " + msg));
                    synchronizer.atMoment(new SteemOperationNumber(sequence.stage3_1_SyncConfirmationMoment.blockNum, sequence.stage3_1_SyncConfirmationMoment.transactionNum + 1, 0));
                    synchronizer.validateOnly(true);
                    synchronizer.synchronize((error: Error | undefined, result: SynchronizationResult | undefined) => {
                        if (error) done(error);
                        else {
                            if (result) {
                                if (result.validVoteorders.length > 0 || result.invalidVoteorders.length > 0) done(new Error("Returned [" + result.validVoteorders.length + " valid,"
                                    + " and " + result.invalidVoteorders.length + " invalid] voteorder after successful sync is done"));
                                else done();
                            }
                            else {
                                done(new Error("Undefined results returned"));
                            }
                        }
                    });
                });
            });

            // TODO test — synchronization returns nothing just after it is done
            // TODO test partial synchronization
        });
    }
});
