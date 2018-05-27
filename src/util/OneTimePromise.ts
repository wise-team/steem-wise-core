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
     */
    public constructor(timeout: number) {
        this.timeout = timeout;
    }

    public execute(promise: Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.finishedWithError) reject(this.error);
            else if (this.finishedWithResult) resolve(this.result);
            else if (!this.started || this.timeCounter > this.timeout) {
                this.started = true;
                return promise.then((result: T) => {
                    this.result = result;
                    this.finishedWithResult = true;
                    resolve(result);
                })
                .catch((error: Error) => {
                    this.error = error;
                    this.finishedWithError = true;
                    reject(error);
                });
            }
            else {
                this.awaitResult(resolve, reject);
            }
        });
    }

    private awaitResult(resolve: (result: T | undefined) => void, reject: (error: Error | undefined) => void) {
        if (this.finishedWithError) reject(this.error);
        else if (this.finishedWithResult) resolve(this.result);
        else {
            setTimeout(() => {
                this.timeCounter += 4;
                this.awaitResult(resolve, reject);
            }, 4);
        }
    }
}