import { SteemPost } from "../blockchain/SteemPost";
import { SetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";

export abstract class AbstractApi {
    public abstract loadPost(author: string, permlink: string): Promise<SteemPost>;
    public abstract loadRulesets(delegator: string, author: string): Promise<SetRules>;
    public abstract streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any>;
}