import { SteemPost } from "../blockchain/SteemPost";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { Api } from "../api/Api";
import { OneTimePromise } from "../util/OneTimePromise";
import { DynamicGlobalProperties } from "../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../blockchain/AccountInfo";

export class ValidationContext {
    private api: Api;
    private delegator: string;
    private voter: string;
    private voteorder: SendVoteorder;
    private postLoader = new OneTimePromise<SteemPost>(10 * 1000);
    private dgpLoader = new OneTimePromise<DynamicGlobalProperties>(10 * 1000);
    private accountInfoLoaders: [string, OneTimePromise<AccountInfo>][] = [];

    public constructor(api: Api, delegator: string, voter: string, voteorder: SendVoteorder) {
        this.api = api;
        this.delegator = delegator;
        this.voter = voter;
        this.voteorder = voteorder;
    }

    public getPost(): Promise<SteemPost> {
        return this.postLoader.execute(() => this.api.loadPost(this.voteorder.author, this.voteorder.permlink));
    }

    public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        return this.dgpLoader.execute(() => this.api.getDynamicGlobalProperties());
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        for (let i = 0; i < this.accountInfoLoaders.length; i++) {
            const loaderTuple = this.accountInfoLoaders[i];
            if (loaderTuple[0] === username) {
                return loaderTuple[1].execute(() => this.api.getAccountInfo(this.voter));
            }
        }
        const loader = new OneTimePromise<AccountInfo>(10 * 1000);
        this.accountInfoLoaders.push([username, loader]);
        return loader.execute(() => this.api.getAccountInfo(this.voter));
    }
}