import { SteemPost } from "../blockchain/SteemPost";
import { SetRules } from "../protocol/SetRules";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";
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

    public async loadPost(author: string, permlink: string): Promise<SteemPost> {
        throw new Error("This api is disabled");
    }

    public async loadRulesets(delegator: string, voter: string, at: SteemOperationNumber): Promise<SetRules> {
        throw new Error("This api is disabled");
    }

    public async sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
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

    public async getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        throw new Error("This api is disabled");
    }

    public async getAccountInfo(username: string): Promise<AccountInfo> {
        throw new Error("This api is disabled");
    }

    public async getWiseOperations(username: string, until: Date, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        throw new Error("This api is disabled");
    }

    public async getBlogEntries(username: string, startFrom: number, limit: number): Promise<BlogEntry []> {
        throw new Error("This api is disabled");
    }
}