
import { ChainableFilter } from "./Chainable";

class ChainableOnError<T> extends ChainableFilter<T, ChainableOnError<T>> {
    private onErrorCallback: (error: Error) => void;

    constructor(onErrorCallback: (error: Error) => void) {
        super();
        this.onErrorCallback = onErrorCallback;
    }

    protected me(): ChainableOnError<T> {
        return this;
    }

    protected take(error: Error | undefined, item: T): boolean {
        if (error) this.onErrorCallback(error);
        return this.give(error, item);
    }
}