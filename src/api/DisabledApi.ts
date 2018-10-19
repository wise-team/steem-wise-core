import * as steem from "steem";
import { SetRules } from "../protocol/SetRules";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";
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

    public async loadRulesets(delegator: string, voter: string, at: SteemOperationNumber): Promise<SetRules> {
        throw new Error("This api is disabled");
    }

    public async sendToBlockchain(operations: steem.OperationWithDescriptor[]): Promise<SteemOperationNumber> {
        throw new Error("This api is disabled");
    }

    public async loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        throw new Error("This api is disabled");
    }

    public async getLastConfirmationMoment(delegator: string): Promise<SteemOperationNumber> {
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

    public async getWiseOperations(username: string, until: Date, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        throw new Error("This api is disabled");
    }

    public async getBlogEntries(username: string, startFrom: number, limit: number): Promise<steem.BlogEntry []> {
        throw new Error("This api is disabled");
    }
}