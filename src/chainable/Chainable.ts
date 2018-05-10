
export abstract class Chainable<FROM, TO, IMPLEMENTERCLASS extends Chainable<FROM, TO, IMPLEMENTERCLASS>> {
    // ABSTRACT MEMBERS
    protected abstract take(error: Error | undefined, item: FROM): boolean;
    protected abstract me(): IMPLEMENTERCLASS;

    // IMPLEMENTATION
    private downstreamChainables: Chainable<TO, any, any> [] = [];

    public chain<N extends Chainable<TO, any, any>>(chainable: N): N {
        this.downstreamChainables.push(chainable);
        return chainable;
    }

    public branch(branchFn: (me: IMPLEMENTERCLASS) => void): IMPLEMENTERCLASS {
        branchFn(this.me());
        return this.me();
    }

    protected shouldLoadNewItems(): boolean {
        return this.downstreamChainables.length > 0;
    }

    protected give(error: Error | undefined, item: TO | undefined): boolean {
        if (this.downstreamChainables.length == 0) throw new Error("There are no downstream chainables in this chainable");

        // slice copies object references into the new array. Both the original and new array refer to the same object.
        const frozenDownstream: Chainable<TO, any, any> [] = this.downstreamChainables.slice();
        for (let i = 0; i < frozenDownstream.length; i++) {
            const downstreamChainable = frozenDownstream[i];
            const result = downstreamChainable.doTake(error, item);
            if (!result) {
                const consumerIndex = this.downstreamChainables.indexOf(downstreamChainable);
                if (consumerIndex !== -1) this.downstreamChainables.splice(consumerIndex, 1);
            }
        }
        return this.shouldLoadNewItems();
    }

    protected doTake(error: Error | undefined, item: FROM | undefined): boolean {
        if (typeof(item) === "undefined" && !error) throw new Error("Got undefined item");

        try {
            return this.take(error, <FROM> item);
        }
        catch (error) {
            this.give(error, undefined);
            return false;
        }
    }
}

/**
 * Generic filter that can be chained.
 */
export abstract class ChainableFilter<TYPE, IMPLEMENTERCLASS extends ChainableFilter<TYPE, IMPLEMENTERCLASS>> extends Chainable<TYPE, TYPE, IMPLEMENTERCLASS> {
}

/**
 * Generic transformer that can be chained.
 */
export abstract class ChainableTransformer<FROM, TO, IMPLEMENTERCLASS extends ChainableTransformer<FROM, TO, IMPLEMENTERCLASS>> extends Chainable<FROM, TO, IMPLEMENTERCLASS> {
}

/**
 * Supplier that does not accept take.
 */
export abstract class ChainableSupplier<TO, IMPLEMENTERCLASS extends ChainableSupplier<TO, IMPLEMENTERCLASS>> extends Chainable<undefined, TO, IMPLEMENTERCLASS> {
    public take(error: Error | undefined, item: undefined | undefined): boolean {
        throw new Error("Supplier cannot take.");
    }
}

/**
 * Taker that cannot be branched or chained.
 */
export abstract class ChainableTaker<FROM, IMPLEMENTERCLASS extends ChainableTaker<FROM, IMPLEMENTERCLASS>> extends Chainable<FROM, undefined, IMPLEMENTERCLASS> {
    public chain<N extends Chainable<undefined, any, any>>(chainable: N): N {
        throw new Error("Cannot chain from Taker.");
    }

    public branch(branchFn: (me: IMPLEMENTERCLASS) => void): IMPLEMENTERCLASS {
        throw new Error("Cannot branch from Taker.");
    }

    protected give(error: Error | undefined, item: undefined | undefined): boolean {
        throw new Error("Taker has no downstream. Cannot call his give");
    }
}

export class SimpleTaker<T> extends ChainableTaker<T, SimpleTaker<T>> {
    private callback: (item: T) => boolean;
    private onErrorCallback: (error: Error) => boolean = (error: Error) => { return false; };

    constructor(callback: (item: T) => boolean) {
        super();
        this.callback = callback;
    }

    public catch(fn: (error: Error) => boolean) {
        this.onErrorCallback = fn;
    }

    protected me(): SimpleTaker<T> {
        return this;
    }

    protected onErrorCought(error: Error) {
        this.onErrorCallback(error);
    }

    protected take(error: Error | undefined, item: T): boolean {
        if (error) {
            return this.onErrorCallback(error);
        }
        else return this.callback(item);
    }

    protected doTake(error: Error | undefined, item: T): boolean {
        if (typeof(item) === "undefined" && !error) throw new Error("Got undefined item");

        try {
            return this.take(error, <T> item);
        }
        catch (error) {
            this.onErrorCallback(error);
            console.error(error);
            return false;
        }
    }
}