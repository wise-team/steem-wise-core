import { ChainableFilter } from "steem-efficient-stream";
import { WiseOperation } from "../../protocol/WiseOperation";

export class VoterFilter extends ChainableFilter<WiseOperation, VoterFilter> {
    private voter: string;

    constructor(voter: string) {
        super();
        this.voter = voter;
    }

    protected me(): VoterFilter {
        return this;
    }

    public take(error: Error | undefined, op: WiseOperation): boolean {
        if (error) throw error;

        if (op.voter === this.voter) return this.give(undefined, op);

        return true;
    }
}