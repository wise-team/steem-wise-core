import { ProtocolVersionHandler } from "../ProtocolVersionHandler";

export class V1Handler implements ProtocolVersionHandler {
    public isMyOperation(): boolean {
        return true;
    }
}