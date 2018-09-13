import { Promise } from "bluebird";

export class OneTimePromise<T> {
    private started: boolean = false;
    private finishedWithError: boolean = false;
    private finishedWithResult: boolean = false;
    private error: Error |  undefined = undefined;
    private result: T | undefined = undefined;
    private timeout: number;
    private timeCounter: number = 0;

    /**
     * This is a Promise wrapper which allows the promise to be executed only once (any further execution returns prevoiusly loaded results)
     * @param timeout - timeout of waiting in milliseconds
     *
     */
    public constructor(timeout: number) {
        this.timeout = timeout;
    }

    /**
     * Executes the promiseReturningFn only on the first call of execute
     * @param promiseReturningFn - Remember that when you call a function that returns a promise, the executor starts executing. That is why you have to pass an function here
     */
    public execute(promiseReturningFn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.finishedWithError) {
                setTimeout(() => reject(this.error), 4);
            }
            else if (this.finishedWithResult) resolve(this.result);
            else if (!this.started || this.timeCounter > this.timeout) {
                this.started = true;
                return promiseReturningFn().then((result: T) => {
                    this.result = result;
                    this.finishedWithResult = true;
                    resolve(result);
                })
                .catch((error: Error) => {
                    this.error = error;
                    this.finishedWithError = true;
                    setTimeout(() => reject(this.error), 4);
                });
            }
            else {
                this.awaitResult(resolve, reject);
            }
        });

    }

    private awaitResult(resolve: (result: T | undefined) => void, reject: (error: Error | undefined) => void) {
        if (this.finishedWithError) {
            setTimeout(() => reject(this.error), 4);
        }
        else if (this.finishedWithResult) resolve(this.result);
        else {
            setTimeout(() => {
                this.timeCounter += 4;
                this.awaitResult(resolve, reject);
            }, 4);
        }
    }
}