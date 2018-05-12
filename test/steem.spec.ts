import { expect } from "chai";
import "mocha";
import * as steem from "steem";

import { RawOperation } from "../src/blockchain/blockchain-operations-types";
import { SteemSmartvotes, SteemOperationNumber } from "../src/steem-smartvotes";
// TODO add many tests
// TODO test confirmation
describe("test/steem.spec.ts", () => {
    describe("account_history_api.get_account_history", () => {
        it("Returns correct op_in_trx", function(done) {
            this.timeout(35000);
            steem.api.getAccountHistory("steemprojects1", 40, 0, (error: Error, result: any) => {
                if (error) {
                    done(error);
                }
                else {
                    if (result.length == 0) {
                        done(new Error("No operations returned"));
                    }
                    else {
                        const rawOp: RawOperation = result[0] as RawOperation;
                        if (rawOp[1].op_in_trx === 3) done(new Error("Steem account_history_api returns correct op_in_trx (" + rawOp[1].op_in_trx + "). The bug was repaird. Please replace all lesserThan_solveOpInTrxBug to lesserThan."));
                        else done(new Error("Steem account_history_api returns wrong op_in_trx (" + rawOp[1].op_in_trx + "). The bug still exists"));
                    }
                }
            });
        });
    });
});