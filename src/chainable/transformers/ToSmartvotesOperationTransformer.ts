import { ChainableTransformer } from "../Chainable";
import { SteemTransaction } from "../../blockchain/SteemTransaction";
import { Protocol } from "../../protocol/Protocol";
import { EffectuatedSmartvotesOperation } from "../../protocol/EffectuatedSmartvotesOperation";

export class ToSmartvotesOperationTransformer extends ChainableTransformer<SteemTransaction, EffectuatedSmartvotesOperation, ToSmartvotesOperationTransformer> {
    private protocol: Protocol;

    public constructor(protocol: Protocol) {
        super();

        this.protocol = protocol;
    }

    protected me(): ToSmartvotesOperationTransformer {
        return this;
    }

    protected take(error: Error | undefined, steemTrx: SteemTransaction): boolean {
        if (error) throw error;

        const handledOrRejected: EffectuatedSmartvotesOperation [] | undefined = this.protocol.handleOrReject(steemTrx);
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