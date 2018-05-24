import { SteemOperation } from "./SteemOperation";
import { SmartvotesOperation } from "./current/SmartvotesOperation";
import { ProtocolVersionRegistry } from "./versions/ProtocolVersionRegistry";

export class Protocol {
    public handleOrReject(op: SteemOperation): SmartvotesOperation | undefined {
        return ProtocolVersionRegistry.handleOrReject(op);
    }
}
