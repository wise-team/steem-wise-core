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

            const loader = new OneTimePromise<number>(100);

            const checkerFn = () => {
                loader.execute(promiseReturner)
                .then((numOfCalls: number) => {
                    if (numOfCalls !== 1) done(new Error("Num of calls does not equal 1"));
                })
                .catch((error: Error) => done(error));
            };

            checkerFn();
            setTimeout(checkerFn, 5);
            setTimeout(checkerFn, 6);
            setTimeout(checkerFn, 10);
            setTimeout(checkerFn, 15);

            setTimeout(() => {
                if (calls === 1) done();
                else done(new Error("Num of calls does not equal 1 (calls = " + calls + ")"));
            }, 25);
        });

        it("rejects on explicit rejections", (done) => {
            let numOfRejects = 0;
            let numOfResolves = 0;
            let numOfCalls = 0;
            const promiseReturner = () => {
                return new Promise<number>((resolve, reject) => {
                    setTimeout(() => {
                        numOfCalls++;
                        reject(new Error("Some error"));
                    }, 10);
                });
            };

            const loader = new OneTimePromise<number>(100);

            const checkerFn = () => {
                loader.execute(promiseReturner)
                .then((numOfCalls: number) => {
                    numOfResolves++;
                    done(new Error("Resolves without error"));
                }, e => {
                    { numOfRejects++; }
                });
            };

            checkerFn();
            setTimeout(checkerFn, 5);
            setTimeout(checkerFn, 10);
            setTimeout(checkerFn, 15);

            setTimeout(() => {
                if (numOfRejects == 4 && numOfResolves == 0 && numOfCalls == 1) done();
                else done(new Error("Not all promises were rejected (rejects=" + numOfRejects + ", resolves=" + numOfResolves + ", calls=" + numOfCalls + ")"));
            }, 25);
        });

        it("rejects on thrown errors", (done) => {
            let numOfRejects = 0;
            const promiseReturner = () => {
                return new Promise<number>((resolve, reject) => {
                    throw new Error("Some error");
                });
            };

            const loader = new OneTimePromise<number>(100);

            const checkerFn = () => {
                loader.execute(promiseReturner)
                .then((numOfCalls: number) => {
                    done(new Error("Resolves without error"));
                })
                .catch((error: Error) => { numOfRejects++; });
            };

            checkerFn();
            setTimeout(checkerFn, 5);
            setTimeout(checkerFn, 10);
            setTimeout(checkerFn, 15);

            setTimeout(() => {
                if (numOfRejects == 4) done();
                else done(new Error("Not all promises were rejected (" + numOfRejects + ")"));
            }, 25);
        });
    });
});
