/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */

/**
 * Source: https://github.com/notenoughneon/await-semaphore/blob/master/index.ts .
 * By https://github.com/notenoughneon under MIT license. Thank you.
 * Semaphore uses setImmediate, which is not a JS standard (and probably will not be): https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate
 * Use it only for tests.
 */
export class Semaphore {
    private tasks: (() => void)[] = [];
    count: number;

    constructor(count: number) {
        this.count = count;
    }

    private sched() {
        if (this.count > 0 && this.tasks.length > 0) {
            this.count--;
            const next = this.tasks.shift();
            if (next === undefined) {
                throw "Unexpected undefined value in tasks list";
            }

            next();
        }
    }

    public acquire() {
        return new BluebirdPromise<() => void>((res, rej) => {
            const task = () => {
                let released = false;
                res(() => {
                    if (!released) {
                        released = true;
                        this.count++;
                        this.sched();
                    }
                });
            };
            this.tasks.push(task);
            if (process && process.nextTick) {
                process.nextTick(this.sched.bind(this));
            } else {
                setImmediate(this.sched.bind(this));
            }
        });
    }

    public use<T>(f: () => Promise<T>) {
        return this.acquire()
            .then(release => {
                return f()
                    .then((res) => {
                        release();
                        return res;
                    })
                    .catch((err) => {
                        release();
                        throw err;
                    });
            });
    }
}

export class Mutex extends Semaphore {
    constructor() {
        super(1);
    }
}