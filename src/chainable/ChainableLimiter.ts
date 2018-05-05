
import { ChainableFilter } from "./Chainable";

export class ChainableLimiter<T> extends ChainableFilter<T, ChainableLimiter<T>> {
    private limit: number;
    private counter: number = 0;

    constructor(limit: number) {
        super();
        this.limit = limit;
    }

    protected me(): ChainableLimiter<T> {
        return this;
    }

    protected take(error: Error | undefined, item: T): boolean {
            const result: boolean = this.give(error, item);
            this.counter++;
            if (this.counter >= this.limit) {
                return false;
            }
            else return result;
    }
}