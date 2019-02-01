import * as steem from "steem";
import { WiseOperation } from "./WiseOperation";
import { ProtocolVersionHandler } from "./versions/ProtocolVersionHandler";
import { EffectuatedWiseOperation } from "./EffectuatedWiseOperation";
import { UnifiedSteemTransaction } from "steem-efficient-stream";

export class Protocol {
    private registry: ProtocolVersionHandler[];

    /**
     * Remember that the current handler should be the first one.
     * @param handlers - protocol version handlers ordered from the newest to the oldest
     */
    public constructor(handlers: ProtocolVersionHandler[]) {
        this.registry = handlers;
        if (this.registry.length == 0) throw new Error("You must specify at least one protocol version handler");
    }

    public handleOrReject(transaction: UnifiedSteemTransaction): EffectuatedWiseOperation[] | undefined {
        for (const pv of this.registry) {
            const result = pv.handleOrReject(transaction);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    public serializeToBlockchain(op: WiseOperation): steem.OperationWithDescriptor[] {
        return this.registry[0].serializeToBlockchain(op);
    }

    /**
     * Validated if steem operation it is a valid wise
     * @param op - an steem operation in format: steem.OperationWithDescriptor object (if it is a pending operation block_num should equal Infinity)
     */
    public validateOperation = (op: steem.OperationWithDescriptor): boolean => {
        const so: UnifiedSteemTransaction = {
            block_num: Infinity,
            transaction_num: 0,
            transaction_id: "",
            timestamp: new Date(),
            ops: [op],
        };
        return this.validateSteemTransaction(so);
    }; // TODO test

    /**
     * Validated if steem operation (object with blockchain data and timestamp) it is a valid wise
     * @param op - an steem operation object that implements SteemTransaction interface
     */ public validateSteemTransaction = (so: UnifiedSteemTransaction): boolean => {
        const res = this.handleOrReject(so);
        return res != undefined;
    };

    public getHandlers(): ProtocolVersionHandler[] {
        return this.registry;
    }
}
