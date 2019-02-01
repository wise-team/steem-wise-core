import * as steem from "steem";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";
import { SteemOperationNumber } from "steem-efficient-stream";
import { Api } from "./Api";
import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";

export class DisabledApi extends Api {
    public constructor() {
        super();
    }

    public name(): string {
        return "DisabledApi";
    }

    public async loadPost(author: string, permlink: string): Promise<steem.SteemPost> {
        throw new Error("This api is disabled");
    }

    public async loadRulesets(forWhom: { voter?: string; delegator?: string }, at: SteemOperationNumber): Promise<EffectuatedSetRules []> {
        throw new Error("This api is disabled");
    }

    public async sendToBlockchain(operations: steem.OperationWithDescriptor[]): Promise<SteemOperationNumber> {
        throw new Error("This api is disabled");
    }

    public async getLastConfirmationMoment(delegator: string): Promise<SteemOperationNumber> {
        throw new Error("This api is disabled");
    }

    public async getAllWiseOperationsInBlock(blockNum: number): Promise<EffectuatedWiseOperation []> {
        throw new Error("This api is disabled");
    }

    public async getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number): Promise<EffectuatedWiseOperation []> {
        throw new Error("This api is disabled");
    }

    public async getDynamicGlobalProperties(): Promise<steem.DynamicGlobalProperties> {
        throw new Error("This api is disabled");
    }

    public async getAccountInfo(username: string): Promise<steem.AccountInfo> {
        throw new Error("This api is disabled");
    }

    public async getWiseOperations(username: string, until: Date): Promise<EffectuatedWiseOperation []> {
        throw new Error("This api is disabled");
    }

    public async getBlogEntries(username: string, startFrom: number, limit: number): Promise<steem.BlogEntry []> {
        throw new Error("This api is disabled");
    }
}