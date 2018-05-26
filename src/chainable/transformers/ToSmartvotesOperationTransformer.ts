import { ChainableTransformer } from "../../chainable/Chainable";
import { SteemOperation } from "../../blockchain/SteemOperation";
import { CustomJsonOperation } from "../../blockchain/CustomJsonOperation";
import { Protocol } from "../../protocol/Protocol";
import { SmartvotesOperation } from "../../protocol/SmartvotesOperation";
import { EffectuatedSmartvotesOperation } from "../../protocol/EffectuatedSmartvotesOperation";

export class ToSmartvotesOperationTransformer extends ChainableTransformer<SteemOperation, EffectuatedSmartvotesOperation, ToSmartvotesOperationTransformer> {
    private protocol: Protocol;

    public constructor(protocol: Protocol) {
        super();

        this.protocol = protocol;
    }

    protected me(): ToSmartvotesOperationTransformer {
        return this;
    }

    protected take(error: Error | undefined, steemOp: SteemOperation): boolean {
        if (error) throw error;

        const handledOrRejected: EffectuatedSmartvotesOperation [] | undefined = this.protocol.handleOrReject(steemOp);
        if (handledOrRejected) {
            let lastResult: boolean = true;
            for (let i = 0; i < handledOrRejected.length; i++) {
                lastResult = this.give(undefined, handledOrRejected[i]);
            }
            return lastResult;
        }
        else return true;
    }
}