import { ChainableFilter } from "../Chainable";
import { WiseOperation } from "../../protocol/WiseOperation";
import { isSetRules } from "../../protocol/SetRules";
import { isSendVoteorder } from "../../protocol/SendVoteorder";
import { isConfirmVote } from "../../protocol/ConfirmVote";

/**
 * Filters steem blockchain operations by type.
 */
export class WiseOperationTypeFilter<T extends WiseOperation> extends ChainableFilter<WiseOperation, WiseOperationTypeFilter<T>> {
    private type: WiseOperationTypeFilter.OperationType;

    constructor(type: WiseOperationTypeFilter.OperationType) {
        super();
        this.type = type;
    }

    protected me(): WiseOperationTypeFilter<T> {
        return this;
    }

    public take(error: Error | undefined, op: WiseOperation): boolean {
        if (error) throw error;

        if (this.type === WiseOperationTypeFilter.OperationType.SetRules) {
            if (isSetRules(op.command)) return this.give(undefined, op as T);
        }
        else if (this.type === WiseOperationTypeFilter.OperationType.SendVoteorder) {
            if (isSendVoteorder(op.command)) return this.give(undefined, op as T);
        }
        else if (this.type === WiseOperationTypeFilter.OperationType.ConfirmVote) {
            if (isConfirmVote(op.command)) return this.give(undefined, op as T);
        }
        else throw new Error("Illegal type of filter");

        return true;
    }
}

export namespace WiseOperationTypeFilter {
    export enum OperationType {
        SetRules,
        SendVoteorder,
        ConfirmVote
    }
}