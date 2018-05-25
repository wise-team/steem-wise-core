import { SteemOperation } from "../blockchain/SteemOperation";
import { SmartvotesOperation } from "./SmartvotesOperation";
import { ProtocolVersionHandler } from "./versions/ProtocolVersionHandler";

export class Protocol {
    private registry: ProtocolVersionHandler [];

    public constructor(handlers: ProtocolVersionHandler []) {
        this.registry = handlers;
    }

    public handleOrReject(op: SteemOperation): SmartvotesOperation [] | undefined {
        for (const pv of this.registry) {
            const result = pv.handleOrReject(op);
            if (result) {
                return result;
            }
        }
        return undefined;
    }
}
