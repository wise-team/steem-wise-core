import { RawOperation } from "../../types/blockchain-operations-types";
import { Supplier } from "../Supplier";
import { Consumer } from "../Consumer";

/**
 * Generic filter that can be chained. It is a supplier and has a consumer.
 */
export abstract class ChainableFilter<T> extends Supplier<T> {
    public getConsumer(): Consumer<T> {
        return (error: Error | undefined, item: T | undefined): boolean => {
            if (error) this.notifyConsumers(error, undefined);
            else {
                if (item && this.getMyFilterFunction()(item)) {
                    this.notifyConsumers(undefined, item);
                }
            }
            return this.shouldLoadNewItems();
        };
    }

    protected abstract getMyFilterFunction(): ((item: T) => boolean);
}