// 3rd party imports
import { expect } from "chai";
import "mocha";
import * as steem from "steem";
import * as _log from "loglevel"; const log = _log.getLogger("steem-wise-core");
log.setLevel(log.levels.INFO);

// wise imports
import { BlockchainConfig } from "../src/blockchain/BlockchainConfig";


describe("test/steem.spec.ts", () => {
    describe("account_history_api.get_account_history", () => {
        it("Returns incorrect op_in_trx", function(done) {
            this.timeout(15000);
            steem.api.getAccountHistory("steemprojects1", 40, 0, (error: Error, result: any) => {
                if (error) {
                    done(error);
                }
                else {
                    if (result.length == 0) {
                        done(new Error("No operations returned"));
                    }
                    else {
                        /**
                         * Generally this is a bad practice to throw error when a bug is fixed, but in this case
                         * it is very important to replace all occurances of lesserThan_solveOpInTrxBug to lesserThan,
                         * when the bug is solved.
                         */
                        const rawOp: [string, {op_in_trx: number}] = result[0] as [string, {op_in_trx: number}];
                        if (rawOp[1].op_in_trx === 3) done(new Error("Steem account_history_api returns correct op_in_trx (" + rawOp[1].op_in_trx + "). The bug was repaird. Please replace all lesserThan_solveOpInTrxBug to lesserThan."));
                        else {
                            log.warn("Steem account_history_api returns wrong op_in_trx (" + rawOp[1].op_in_trx + "). The bug still persists, but is patched in this app, so there is nothing to do.");
                            done();
                        }
                    }
                }
            });
        });
    });

    describe("BlockchainConfig", () => {
        it("contains correct values", (done) => {
            steem.api.getConfig((error: Error | undefined, result: { [s: string]: string; }) => {
                if (error) done(error);
                else {
                    try {
                        for (const v_ of BlockchainConfig.configValueAssertionArray as [string, any][]) {
                            const variable = v_ as [string, any];
                            const index: string = variable[0];
                            const loadedVariable: string = result[index];
                            expect(variable[1], "BlockchainConfig." + variable[0]).to.be.equal(loadedVariable);
                        }
                        done();
                    } catch (error) {
                        done(error);
                    }
                }
            });
        });
    });
});