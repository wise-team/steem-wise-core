import { smartvotes_operation } from "../../../schema/smartvotes.schema";
import { ChainableFilter } from "../../Chainable";

/**
 * Filters steem blockchain operations by type.
 */
export class SmartvotesOperationTypeFilter<T extends smartvotes_operation> extends ChainableFilter<smartvotes_operation, SmartvotesOperationTypeFilter<T>> {
    private typeName: string;

    constructor(typeName: string) {
        super();
        this.typeName = typeName;
    }

    protected me(): SmartvotesOperationTypeFilter<T> {
        return this;
    }

    public take(error: Error | undefined, op: smartvotes_operation): boolean {
        if (error) throw error;
        if (op.name == this.typeName) {
            return this.give(undefined, op as T);
        }
        else return true;
    }
}