// 3rd party imports
/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import "mocha";
import { Log } from "../../src/log/Log";

// wise imports
import { OneTimePromise } from "../../src/util/OneTimePromise";


describe("test/unit/util.spec.ts", () => {
    describe("OneTimePromise", function() {
        it("runs the promise exactly once", (done) => {
            let calls = 0;
            const promiseReturner = async () => {
                return await new BluebirdPromise<number>((resolve, reject) => {
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
            const promiseReturner = async () => {
                return await new BluebirdPromise<number>((resolve, reject) => {
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
            }, 45);
        });

        it("rejects on thrown errors", (done) => {
            let numOfRejects = 0;
            const promiseReturner = async () => {
                return await new BluebirdPromise<number>((resolve, reject) => {
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
