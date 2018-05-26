import { Promise } from "bluebird";

import { SteemPost } from "../blockchain/SteemPost";
import { SetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";
import { DirectBlockchainApi } from "./DirectBlockchainApi";

export class WiseRESTApi extends Api {
    private host: string;
    private directBlockchainApi: DirectBlockchainApi;

    public constructor(host: string, username: string, postingWif: string, steemOptions: object | undefined = undefined) {
        super();

        this.host = host;
        this.directBlockchainApi = new DirectBlockchainApi(username, postingWif, steemOptions);
    }

    public name(): string {
        return "WiseRESTApi";
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }

    public loadRulesets(delegator: string, voter: string, at: SteemOperationNumber, protocol: Protocol): Promise<SetRules> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }

    public streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any> {
        throw new Error("Not implemented yet");
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }
}