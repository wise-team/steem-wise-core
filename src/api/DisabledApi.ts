import { Promise } from "bluebird";

import { SteemPost } from "../blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";
import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";
import { DynamicGlobalProperties } from "../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../blockchain/AccountInfo";
import { BlogEntry } from "../blockchain/BlogEntry";

export class DisabledApi extends Api {
    public constructor() {
        super();
    }

    public name(): string {
        return "DisabledApi";
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public loadRulesets(delegator: string, voter: string, at: SteemOperationNumber): Promise<SetRules> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getLastConfirmationMoment(delegator: string): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number): Promise<EffectuatedWiseOperation []> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getWiseOperations(username: string, until: Date, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        return Promise.reject(new Error("This api is disabled"));
    }

    public getBlogEntries(username: string, startFrom: number, limit: number): Promise<BlogEntry []> {
        return Promise.reject(new Error("This api is disabled"));
    }
}