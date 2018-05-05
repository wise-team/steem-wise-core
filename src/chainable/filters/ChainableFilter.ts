import { RawOperation } from "../../types/blockchain-operations-types";
import { Supplier } from "../Supplier";
import { Consumer } from "../Consumer";

/**
 * Generic filter that can be chained. It is a supplier and has a consumer.
 */
export abstract class ChainableFilter<T> {
    private supplier: Supplier<T> = new Supplier<T>();

    public getConsumer(): Consumer<T> {
        return (error: Error | undefined, item: T | undefined): boolean => {
            if (error) this.supplier.notifyConsumers(error, undefined);
            else {
                if (item && this.getMyFilterFunction()(item)) {
                    this.supplier.notifyConsumers(undefined, item);
                }
            }
            return this.supplier.shouldLoadNewItems();
        };
    }

    protected addConsumer(consumer: Consumer<T>) {
        this.supplier.addConsumer(consumer);
    }

    protected abstract getMyFilterFunction(): ((item: T) => boolean);
}