import { ProtocolVersionHandler } from "./ProtocolVersionHandler";
import { V1Handler } from "./v1/V1Handler";
import { SteemOperation } from "../SteemOperation";
import { SmartvotesOperation } from "../current/SmartvotesOperation";

export class ProtocolVersionRegistry {
    private static registry: ProtocolVersionHandler [] = [
        new V1Handler(),
    ];

    public static handleOrReject(op: SteemOperation): SmartvotesOperation | undefined {
        for (const pv of ProtocolVersionRegistry.registry) {
            const result = pv.handleOrReject(op);
            if (result) {
                return result;
            }
        }
        return undefined;
    }
}
