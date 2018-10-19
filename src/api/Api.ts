import * as steem from "steem";

import { SetRules } from "../protocol/SetRules";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { Protocol } from "../protocol/Protocol";
import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";

// TODO comment
export abstract class Api {
    public abstract name(): string;
    public abstract loadPost(author: string, permlink: string): Promise<steem.SteemPost>; // throws NotFoundException
    public abstract loadRulesets(delegator: string, voter: string, at: SteemOperationNumber, protocol: Protocol): Promise<SetRules>;
    public abstract loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []>;
    public abstract sendToBlockchain(operations: steem.OperationWithDescriptor[]): Promise<SteemOperationNumber>;
    public abstract getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber>;
    public abstract getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol): Promise<EffectuatedWiseOperation []>;
    public abstract getDynamicGlobalProperties(): Promise<steem.DynamicGlobalProperties>;
    public abstract getAccountInfo(username: string): Promise<steem.AccountInfo>; // throws NotFoundException

    /**
     * Returns WISE operations related to given username that are newer than until.
     * @param username - steem username
     * @param until - the oldest date to search for operations.
     */
    public abstract getWiseOperations(username: string, until: Date, protocol: Protocol): Promise<EffectuatedWiseOperation []>;

    /**
     * Returns last user blog entries from follow_api. They are sorted from the newest to the oldest,
     * trimmed to the limit.
     * @param username - steem username
     * @param startFrom - number of the entry to start from counting from the newest to the oldest
     *      (startFrom=0 will return the newest entry)
     * @param limit - limit the number of returned entries (maximal limit is 500).
     */
    public abstract getBlogEntries(username: string, startFrom: number, limit: number): Promise<steem.BlogEntry []>;
}
