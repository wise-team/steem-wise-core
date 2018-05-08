import { expect } from "chai";
import "mocha";
import { Promise } from "bluebird";
import * as steem from "steem";

import { RawOperation, CustomJsonOperation, VoteOperation } from "../src/blockchain/blockchain-operations-types";
import { AccountHistorySupplier } from "../src/chainable/suppliers/AccountHistorySupplier";
import { Chainable, SmartvotesFilter, ChainableLimiter, SimpleTaker, OperationTypeFilter, OperationNumberFilter } from "../src/chainable/_exports";
import { SteemOperationNumber } from "../src/steem-smartvotes";
import { Synchronizer } from "../src/blockchain/Synchronizer";
import { VoteorderAtMoment } from "../src/validation/smartvote-types-at-moment";

describe("test/synchronization.spec.ts", () => {
    describe("Synchronizer", () => {
        it.skip("prints something", function(done) {
            this.timeout(25000);
            const synchronizer = new Synchronizer(steem, "steemprojects1", "-");
            synchronizer.withProggressCallback((msg, proggress) => console.log("Proggress: " + msg));
            synchronizer.withValidateOnly(true);
            synchronizer.synchronize((error: Error | undefined, result: VoteorderAtMoment [] | undefined) => {
                if (error) done(error);
                else {
                    /* tslint:disable no-null-keyword */
                    console.log(JSON.stringify(result, null, 2));
                    done();
                }
            });
        });
    });
});

// test using invalid voteorders in blockchain