import { RawOperation } from "../../types/blockchain-operations-types";
import { Supplier } from "../Supplier";
import { Consumer } from "../Consumer";

/**
 * Transforms one object to another
 */
export abstract class ChainableTransformer<F, T> {
    private supplier: Supplier<T> = new Supplier<T>();

    public getConsumer(): Consumer<F> {
        return (error: Error | undefined, from: F | undefined): boolean => {
            if (error) this.supplier.notifyConsumers(error, undefined);
            else {
                if (from) {
                    const toObj: T = this.getMyTransformFunction()(from);
                    this.supplier.notifyConsumers(undefined, toObj);
                }
            }
            return this.supplier.shouldLoadNewItems();
        };
    }

    public chain(consumer: Consumer<T>): Consumer<T> {
        this.supplier.addConsumer(consumer);
        return consumer;
    }

    protected abstract getMyTransformFunction(): ((item: F) => T);
}