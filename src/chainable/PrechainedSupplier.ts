import { Chainable, ChainableSupplier, SimpleTaker } from "./Chainable";


export class PrechainedSupplier<T> extends ChainableSupplier<T, PrechainedSupplier<T>> {
    private bridgedSupplier: ChainableSupplier<T, any>;

    public constructor(bridgedSupplier: ChainableSupplier<T, any>, prechainerFn: (bridged: ChainableSupplier<T, any>) => Chainable<T, T, any>) {
        super();

        this.bridgedSupplier = bridgedSupplier;
        prechainerFn(this.bridgedSupplier)
        .chain(new SimpleTaker((item: T): boolean => {
            return this.give(undefined, item);
        }))
        .catch((error: Error) => {
            return this.give(error, undefined);
        });
    }

    public me(): PrechainedSupplier<T> {
        return this;
    }

    public onFinish(callback: () => void): PrechainedSupplier<T> {
        this.bridgedSupplier.onFinish(callback);
        return this;
    }

    public start(callback?: () => void): void {
        this.bridgedSupplier.start(callback);
    }
}