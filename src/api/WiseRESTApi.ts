import { Promise } from "bluebird";

import { SteemPost } from "../blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";
import { DirectBlockchainApi } from "./directblockchain/DirectBlockchainApi";
import axios from "axios";
import { EffectuatedSmartvotesOperation } from "../protocol/EffectuatedSmartvotesOperation";

export class WiseRESTApi extends Api {
    public static NOISY_ENDPOINT_HOST: string = "//to-be-launched/";

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
        return this.directBlockchainApi.loadPost(author, permlink);
    }

    public loadRulesets(delegator: string, voter: string, at: SteemOperationNumber): Promise<SetRules> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return this.directBlockchainApi.sendToBlockchain(operations);
    }

    public loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }

    public getLastConfirmationMoment(delegator: string): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number): Promise<EffectuatedSmartvotesOperation []> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }
}