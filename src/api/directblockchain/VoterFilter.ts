import { ChainableFilter } from "../../chainable/Chainable";
import { SmartvotesOperation } from "../../protocol/SmartvotesOperation";

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