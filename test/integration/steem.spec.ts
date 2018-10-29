// 3rd party imports
import { expect } from "chai";
import "mocha";
import * as steemJs from "steem";
import { Log } from "../../src/log/log";

// wise imports
import { BlockchainConfig } from "../../src/blockchain/BlockchainConfig";


describe("test/integration/steem.spec.ts", () => {
    const DEFAULT_STEEM_API_ENDPOINT_URL = /*§ §*/ "https://api.steemit.com" /*§ ' "' + data.config.steem.defaultApiUrl + '" ' §.*/;

    describe("account_history_api.get_account_history", function () {
        this.timeout(15000);
        const steem: steemJs.api.Steem = new steemJs.api.Steem({ url: DEFAULT_STEEM_API_ENDPOINT_URL });

        it("Returns incorrect op_in_trx", async () => {
            const result: steemJs.AccountHistory.Operation [] = await steem.getAccountHistoryAsync("steemprojects1", 40, 0);
            if (result.length == 0) {
                throw new Error("No operations returned");
            }
            else {
                /**
                 * Generally this is a bad practice to throw error when a bug is fixed, but in this case
                 * it is very important to replace all occurances of lesserThan_solveOpInTrxBug to lesserThan,
                 * when the bug is solved.
                 */
                const rawOp: steemJs.AccountHistory.Operation = result[0];
                if (rawOp[1].op_in_trx === 3) throw new Error("Steem account_history_api returns correct op_in_trx ("
                        + rawOp[1].op_in_trx + "). The bug was repaird. Please replace all lesserThan_solveOpInTrxBug"
                        + " to lesserThan.");
                else {
                    Log.log().warn("Steem account_history_api returns wrong op_in_trx (" + rawOp[1].op_in_trx
                        + "). The bug still persists, but is patched in this app, so there is nothing to do.");
                }
            }
        });
    });

    describe("BlockchainConfig", () => {
        it("contains correct values", async () => {
            const steem: steemJs.api.Steem = new steemJs.api.Steem({ url: DEFAULT_STEEM_API_ENDPOINT_URL });
            const result = await steem.getConfigAsync();

            for (const v_ of BlockchainConfig.configValueAssertionArray as [string, any][]) {
                const variable = v_ as [string, any];
                const index: string = variable[0];
                const loadedVariable: string = result[index];
                expect(variable[1], "BlockchainConfig." + variable[0]).to.be.equal(loadedVariable);
            }
        });
    });
});