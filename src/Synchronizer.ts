import { Api } from "./api/Api";
import { Protocol } from "./protocol/Protocol";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";

export class Synchronizer {
    private api: Api;
    private protocol: Protocol;
    private delegator: string;

    public constructor(api: Api, protocol: Protocol, delegator: string) {
        this.api = api;
        this.protocol = protocol;
        this.delegator = delegator;
    }

    public runLoop(since: SteemOperationNumber, notifierCallback: (error: Error | undefined, message: string, moment: SteemOperationNumber) => boolean) {
        throw new Error("Not implemented yet");
    }
}