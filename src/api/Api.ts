import { SteemPost } from "../blockchain/SteemPost";
import { SetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";

export abstract class Api {
    public abstract name(): string;
    public abstract loadPost(author: string, permlink: string): Promise<SteemPost>;
    public abstract loadRulesets(delegator: string, voter: string, at: SteemOperationNumber): Promise<SetRules>;
    public abstract streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any>;
    public abstract sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber>;
}