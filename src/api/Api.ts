import { SteemPost } from "../blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";
import { Protocol } from "../protocol/Protocol";
import { EffectuatedSmartvotesOperation } from "../protocol/EffectuatedSmartvotesOperation";
import { DynamicGlobalProperties } from "../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../blockchain/AccountInfo";

// TODO comment
export abstract class Api {
    public abstract name(): string;
    public abstract loadPost(author: string, permlink: string): Promise<SteemPost>; // throws NotFoundException
    public abstract loadRulesets(delegator: string, voter: string, at: SteemOperationNumber, protocol: Protocol): Promise<SetRules>; // throws NotFoundException
    public abstract loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []>; // throws NotFoundException
    public abstract sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber>;
    public abstract getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber>;
    public abstract getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol): Promise<EffectuatedSmartvotesOperation []>;
    public abstract getDynamicGlobalProperties(): Promise<DynamicGlobalProperties>;
    public abstract getAccountInfo(username: string): Promise<AccountInfo>; // throws NotFoundException
}