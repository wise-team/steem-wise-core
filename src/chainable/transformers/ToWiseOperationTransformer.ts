import { ChainableTransformer } from "steem-efficient-stream";
import { Protocol } from "../../protocol/Protocol";
import { EffectuatedWiseOperation } from "../../protocol/EffectuatedWiseOperation";
import { UnifiedSteemTransaction } from "steem-efficient-stream";

export class ToWiseOperationTransformer extends ChainableTransformer<
    UnifiedSteemTransaction,
    EffectuatedWiseOperation,
    ToWiseOperationTransformer
> {
    private protocol: Protocol;

    public constructor(protocol: Protocol) {
        super();

        this.protocol = protocol;
    }

    protected me(): ToWiseOperationTransformer {
        return this;
    }

    protected take(error: Error | undefined, steemTrx: UnifiedSteemTransaction): boolean {
        if (error) throw error;

        const handledOrRejected: EffectuatedWiseOperation[] | undefined = this.protocol.handleOrReject(steemTrx);
        if (handledOrRejected) {
            let lastResult: boolean = true;
            for (let i = 0; i < handledOrRejected.length; i++) {
                lastResult = this.give(undefined, handledOrRejected[i]);
            }
            return lastResult;
        } else return true;
    }
}
