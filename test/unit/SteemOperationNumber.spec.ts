/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import "mocha";
import * as _ from "lodash";
import { expect, assert } from "chai";

import { Log } from "../../src/log/Log";

// wise imports
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";


describe("test/unit/SteemOperationNumber.spec.ts", () => {
    describe("SteemOperationNumber", () => {
        describe("#compare", () => {
            it ("Sorting using #compare does it in correct order", () => {
                const sorted: SteemOperationNumber [] = [
                    SteemOperationNumber.NEVER,
                    new SteemOperationNumber(0, 0, 0),
                    new SteemOperationNumber(20, 0, 0),
                    new SteemOperationNumber(30, 0, 0),
                    new SteemOperationNumber(40, 0, 0),
                    new SteemOperationNumber(40, 1, 100),
                    new SteemOperationNumber(40, 5, 100),
                    new SteemOperationNumber(40, 100, 5),
                    new SteemOperationNumber(40, 100, 100),
                    new SteemOperationNumber(50, 0, 0),
                    SteemOperationNumber.NOW,
                    SteemOperationNumber.FUTURE
                ];
                const random = _.shuffle(_.cloneDeep(sorted));

                random.sort(SteemOperationNumber.compare);
                expect(sorted).to.deep.equal(random);
            });
        });
    });
});
