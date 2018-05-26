import { ChainableFilter } from "../../chainable/Chainable";
import { SmartvotesOperation } from "../../protocol/SmartvotesOperation";
import { isSetRules } from "../../protocol/SetRules";
import { isSendVoteorder } from "../../protocol/SendVoteorder";
import { isConfirmVote } from "../../protocol/ConfirmVote";

export class VoterFilter extends ChainableFilter<SmartvotesOperation, VoterFilter> {
    private voter: string;

    constructor(voter: string) {
        super();
        this.voter = voter;
    }

    protected me(): VoterFilter {
        return this;
    }

    public take(error: Error | undefined, op: SmartvotesOperation): boolean {
        if (error) throw error;

        if (op.voter === this.voter) return this.give(undefined, op);

        return true;
    }
}