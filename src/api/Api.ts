import { SteemPost } from "../blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { Protocol } from "../protocol/Protocol";
import { EffectuatedSmartvotesOperation } from "../protocol/EffectuatedSmartvotesOperation";
import { DynamicGlobalProperties } from "../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../blockchain/AccountInfo";
import { BlogEntry } from "../blockchain/BlogEntry";

// TODO comment
export abstract class Api {
    public abstract name(): string;
    public abstract loadPost(author: string, permlink: string): Promise<SteemPost>; // throws NotFoundException
    public abstract loadRulesets(delegator: string, voter: string, at: SteemOperationNumber, protocol: Protocol): Promise<SetRules>;
    public abstract loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []>;
    public abstract sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber>;
    public abstract getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber>;
    public abstract getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol): Promise<EffectuatedSmartvotesOperation []>;
    public abstract getDynamicGlobalProperties(): Promise<DynamicGlobalProperties>;
    public abstract getAccountInfo(username: string): Promise<AccountInfo>; // throws NotFoundException

    /**
     * Returns WISE operations related to given username that are newer than until.
     * @param username - steem username
     * @param until — the oldest date to search for operations.
     */
    public abstract getWiseOperations(username: string, until: Date, protocol: Protocol): Promise<EffectuatedSmartvotesOperation []>; // TODO test

    /**
     * Returns last user blog entries from follow_api. They are sorted from the newest to the oldest,
     * trimmed to the limit.
     * @param username - steem username
     * @param startFrom - number of the entry to start from counting from the newest to the oldest
     *      (startFrom=0 will return the newest entry)
     * @param limit — limit the number of returned entries (maximal limit is 500).
     */
    public abstract getBlogEntries(username: string, startFrom: number, limit: number): Promise<BlogEntry []>;
}