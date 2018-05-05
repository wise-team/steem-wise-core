
/**
 * Consumer function interface for a Supplier-consumer pattern. It is passed to the Supplier via #addConsumer() method.
 * Supplier the calls this method for every new data item. If the Consumer returns true — next data is loaded, and the Consumer is notified.
 * Otherwise (if the Consumer returns false) it will not be notified anymore. Also — when all of the consumers returns false — Supplier
 * will stop loading new data.
 */
export interface Consumer<T> {
    (error: Error | undefined, item: T | undefined): boolean;
}