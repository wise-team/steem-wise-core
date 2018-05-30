import { expect, assert } from "chai";
import { Promise } from "bluebird";
import "mocha";

import { OneTimePromise } from "../src/util/OneTimePromise";

describe("test/util.spec.ts", () => {
    describe("OneTimePromise", function() {
        it("runs the promise exactly once", (done) => {
            let calls = 0;
            const promiseReturner = () => {
                return new Promise<number>((resolve, reject) => {
                    setTimeout(() => {
                        calls++;
                        resolve(calls);
                    }, 10);
                });
            };

            const loader = new OneTimePromise<number>(100 * 1000);

            const checkerFn = () => {
                loader.execute(promiseReturner)
                .then((numOfCalls: number) => {
                    if (numOfCalls !== 1) done(new Error("Num of calls does not equal 1"));
                })
                .catch((error: Error) => done(error));
            };

            setTimeout(checkerFn, 5);
            setTimeout(checkerFn, 6);
            setTimeout(checkerFn, 10);
            setTimeout(checkerFn, 15);

            setTimeout(() => {
                if (calls === 1) done();
                else done(new Error("Num of calls does not equal 1 (calls = " + calls + ")"));
            }, 25);
        });
    });
});
