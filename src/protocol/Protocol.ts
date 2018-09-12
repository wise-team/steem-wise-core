import { SteemTransaction } from "../blockchain/SteemTransaction";
import { WiseOperation } from "./WiseOperation";
import { ProtocolVersionHandler } from "./versions/ProtocolVersionHandler";
import { EffectuatedWiseOperation } from "./EffectuatedWiseOperation";

export class Protocol {
    private registry: ProtocolVersionHandler [];

    /**
     * Remember that the current handler should be the first one.
     * @param handlers - protocol version handlers ordered from the newest to the oldest
     */
    public constructor(handlers: ProtocolVersionHandler []) {
        this.registry = handlers;
        if (this.registry.length == 0) throw new Error("You must specify at least one protocol version handler");
    }

    public handleOrReject(transaction: SteemTransaction): EffectuatedWiseOperation [] | undefined {
        for (const pv of this.registry) {
            const result = pv.handleOrReject(transaction);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    public serializeToBlockchain(op: WiseOperation): [string, object][] {
        return this.registry[0].serializeToBlockchain(op);
    }

    /**
     * Validated if steem operation it is a valid wise
     * @param op - an steem operation in format: [string, object] object (if it is a pending operation block_num should equal Infinity)
     */ // TODO test
     public validateOperation = (op: [string, object]): boolean => {
        const so: SteemTransaction = {
            block_num: Infinity,
            transaction_num: 0,
            transaction_id: "",
            timestamp: new Date(),
            ops: [op]
        };
        return this.validateSteemTransaction(so);
    }

    /**
     * Validated if steem operation (object with blockchain data and timestamp) it is a valid wise
     * @param op - an steem operation object that implements SteemTransaction interface
     */ // TODO test
    public validateSteemTransaction = (so: SteemTransaction): boolean => {
        const res = this.handleOrReject(so);
        return res != undefined;
    }
}
