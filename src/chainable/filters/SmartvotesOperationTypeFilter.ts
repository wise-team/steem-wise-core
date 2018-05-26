import { ChainableFilter } from "../Chainable";
import { SmartvotesOperation } from "../../protocol/SmartvotesOperation";
import { isSetRules } from "../../protocol/SetRules";
import { isSendVoteorder } from "../../protocol/SendVoteorder";
import { isConfirmVote } from "../../protocol/ConfirmVote";

/**
 * Filters steem blockchain operations by type.
 */
export class SmartvotesOperationTypeFilter<T extends SmartvotesOperation> extends ChainableFilter<SmartvotesOperation, SmartvotesOperationTypeFilter<T>> {
    private type: SmartvotesOperationTypeFilter.OperationType;

    constructor(type: SmartvotesOperationTypeFilter.OperationType) {
        super();
        this.type = type;
    }

    protected me(): SmartvotesOperationTypeFilter<T> {
        return this;
    }

    public take(error: Error | undefined, op: SmartvotesOperation): boolean {
        if (error) throw error;

        if (this.type === SmartvotesOperationTypeFilter.OperationType.SetRules) {
            if (isSetRules(op.command)) return this.give(undefined, op as T);
        }
        else if (this.type === SmartvotesOperationTypeFilter.OperationType.SendVoteorder) {
            if (isSendVoteorder(op.command)) return this.give(undefined, op as T);
        }
        else if (this.type === SmartvotesOperationTypeFilter.OperationType.ConfirmVote) {
            if (isConfirmVote(op.command)) return this.give(undefined, op as T);
        }
        else throw new Error("Illegal type of filter");

        throw new Error("Unknown type of SmartvotesOperation");
    }
}

export namespace SmartvotesOperationTypeFilter {
    export enum OperationType {
        SetRules,
        SendVoteorder,
        ConfirmVote
    }
}