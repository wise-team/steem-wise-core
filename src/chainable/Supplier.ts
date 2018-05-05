import { Consumer } from "./Consumer";

export  class Supplier<T> {
    private consumers: Consumer<T> [] = [];

    public addConsumer(consumer: Consumer<T>) {
        this.consumers.push(consumer);
    }

    public shouldLoadNewItems(): boolean {
        return this.consumers.length > 0;
    }

    public notifyConsumers(error: Error | undefined, item: T | undefined): boolean {
        if (this.consumers.length == 0) throw new Error("There are no consumers in this Supplier");

        // slice copies object references into the new array. Both the original and new array refer to the same object.
        const frozenConsumers: Consumer<T> [] = this.consumers.slice();
        for (let i = 0; i < frozenConsumers.length; i++) {
            const consumer = frozenConsumers[i];
            const result = consumer(error, item);
            if (!result) {
                const consumerIndex = this.consumers.indexOf(consumer);
                if (consumerIndex !== -1) this.consumers.splice(consumerIndex, 1);
            }
        }
        return this.shouldLoadNewItems();
    }
}