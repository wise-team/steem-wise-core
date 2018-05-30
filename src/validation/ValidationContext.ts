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
    private postLoader = new OneTimePromise<SteemPost>(100 * 1000);
    private dgpLoader = new OneTimePromise<DynamicGlobalProperties>(100 * 1000);
    private voterInfoLoader = new OneTimePromise<AccountInfo>(100 * 1000);
    private delegatorInfoLoader = new OneTimePromise<AccountInfo>(100 * 1000);

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

    public getVoterInfo(): Promise<AccountInfo> {
        return this.voterInfoLoader.execute(() => this.api.getAccountInfo(this.voter));
    }

    public getDelegatorInfo(): Promise<AccountInfo> {
        return this.delegatorInfoLoader.execute(() => this.api.getAccountInfo(this.delegator));
    }
}