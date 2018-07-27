import { Promise } from "bluebird";

import { SteemPost } from "../blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";
import { DirectBlockchainApi } from "./directblockchain/DirectBlockchainApi";
import { EffectuatedSmartvotesOperation } from "../protocol/EffectuatedSmartvotesOperation";
import { DynamicGlobalProperties } from "../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../blockchain/AccountInfo";
import { BlogEntry } from "../blockchain/BlogEntry";

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

    public getWiseOperations(username: string, until: Date): Promise<EffectuatedSmartvotesOperation []> {
        return Promise.reject(new Error("Not yet implemented"));
    }

    public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        return this.directBlockchainApi.getDynamicGlobalProperties();
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        return this.directBlockchainApi.getAccountInfo(username);
    }

    public getBlogEntries(username: string, startFrom: number, limit: number): Promise<BlogEntry []> {
        return Promise.reject(new Error("Not yet implemented"));
    }
}