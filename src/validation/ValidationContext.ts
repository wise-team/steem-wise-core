import * as steem from "steem";

import { SendVoteorder } from "../protocol/SendVoteorder";
import { Api } from "../api/Api";
import { OneTimePromise } from "../util/OneTimePromise";
import { EffectuatedWiseOperation } from "../protocol/EffectuatedWiseOperation";
import { Log } from "../util/log";

export class ValidationContext {
    private api: Api;
    private delegator: string;
    private voter: string;
    private voteorder: SendVoteorder;
    private postLoader = new OneTimePromise<steem.SteemPost>(10 * 1000);
    private dgpLoader = new OneTimePromise<steem.DynamicGlobalProperties>(10 * 1000);
    private accountInfoLoaders: [string, OneTimePromise<steem.AccountInfo>][] = [];

    public constructor(api: Api, delegator: string, voter: string, voteorder: SendVoteorder) {
        this.api = api;
        this.delegator = delegator;
        this.voter = voter;
        this.voteorder = voteorder;

        Log.log().cheapDebug(() => "ValidationContext.construct(delegator=" + delegator + ", voter=" + voter + ", voteorder=" + JSON.stringify(voteorder, undefined, 2));
    }

    public getPost(): Promise<steem.SteemPost> {
        return this.postLoader.execute(() => this.api.loadPost(this.voteorder.author, this.voteorder.permlink));
    }

    public getDynamicGlobalProperties(): Promise<steem.DynamicGlobalProperties> {
        return this.dgpLoader.execute(() => this.api.getDynamicGlobalProperties());
    }

    public getAccountInfo(username: string): Promise<steem.AccountInfo> {
        for (let i = 0; i < this.accountInfoLoaders.length; i++) {
            const loaderTuple = this.accountInfoLoaders[i];
            if (loaderTuple[0] === username) {
                return loaderTuple[1].execute(() => this.api.getAccountInfo(username));
            }
        }
        const loader = new OneTimePromise<steem.AccountInfo>(10 * 1000);
        this.accountInfoLoaders.push([username, loader]);
        return loader.execute(() => this.api.getAccountInfo(username));
    }

    public getDelegatorUsername(): string {
        return this.delegator;
    }

    public getVoterUsername(): string {
        return this.voter;
    }

    /**
     * Returns WISE operations related to given username that are newer than until.
     * @param username - steem username
     * @param until - the oldest date to search for operations.
     */
    public getWiseOperations(username: string, until: Date): Promise<EffectuatedWiseOperation []> {
        return this.api.getWiseOperations(username, until);
    }

    /**
     * Returns last user blog entries from follow_api. They are sorted from the newest to the oldest,
     * trimmed to the limit.
     * @param username - steem username
     * @param startFrom - number of the entry to start from counting from the newest to the oldest
     *      (startFrom=0 will return the newest entry)
     * @param limit - limit the number of returned entries (maximal limit is 500).
     */
    public getBlogEntries(username: string, startFrom: number, limit: number): Promise<steem.BlogEntry []> {
        return this.api.getBlogEntries(username, startFrom, limit);
    }
}