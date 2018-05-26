import { SteemOperation } from "../blockchain/SteemOperation";
import { SmartvotesOperation } from "./SmartvotesOperation";
import { ProtocolVersionHandler } from "./versions/ProtocolVersionHandler";
import { EffectuatedSmartvotesOperation } from "./EffectuatedSmartvotesOperation";

export class Protocol {
    private registry: ProtocolVersionHandler [];

    /**
     * Remember that the current handler should be the first one.
     * @param handlers — protocol version handlers ordered from the newest to the oldest
     */
    public constructor(handlers: ProtocolVersionHandler []) {
        this.registry = handlers;
        if (this.registry.length == 0) throw new Error("You must specify at least one protocol version handler");
    }

    public handleOrReject(op: SteemOperation): EffectuatedSmartvotesOperation [] | undefined {
        for (const pv of this.registry) {
            const result = pv.handleOrReject(op);
            if (result) {
                return result;
            }
        }
        return undefined;
    }

    public serializeToBlockchain(op: SmartvotesOperation): [string, object][] {
        return this.registry[0].serializeToBlockchain(op);
    }
}
