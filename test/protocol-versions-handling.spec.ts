// 3rd party imports
import { expect } from "chai";
import "mocha";
import { Log } from "../src/util/log"; const log = Log.getLogger(); Log.setLevel("info");

// wise imports
import { Wise, SteemTransaction } from "../src/wise";
import { DisabledApi } from "../src/api/DisabledApi";


/* PREPARE TESTING DATASETS */
import * as v1ValidOperations_ from "./data/operations/v1-valid.operations.json";
const v1ValidOperations: SteemOperation [] = v1ValidOperations_ as any as SteemOperation [];
import * as v1InvalidOperations_ from "./data/operations/v1-invalid.operations.json";
const v1InvalidOperations: SteemOperation [] = v1InvalidOperations_ as any as SteemOperation [];


describe("test/protocol-versions-handling.spec.ts", function() {
    this.timeout(3000);

    describe("Protocol V1", () => {
        const wise = new Wise("", new DisabledApi());
        const protocol = wise.getProtocol();

        it ("Validates all previously valid V1 (smartvote) operations as valid", () => {
            for (const op of v1ValidOperations) {
                const result = wise.validateSteemTransaction(operationToTransaction(op));
                expect(result).to.be.true;
            }
        });

        it ("Validates all previously invalid V1 (smartvote) operations as valid", () => {
            for (const op of v1InvalidOperations) {
                const result = wise.validateSteemTransaction(operationToTransaction(op));
                expect(result).to.be.false;
            }
        });
    });
});



interface SteemOperation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    timestamp: Date;
    op: [string, object];
}

function operationToTransaction(op: SteemOperation): SteemTransaction {
    const tx: SteemTransaction = {
        block_num: op.block_num,
        transaction_num: op.transaction_num,
        transaction_id: op.transaction_id,
        timestamp: op.timestamp,
        ops: [op.op]
    };
    return tx;
}