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
}
