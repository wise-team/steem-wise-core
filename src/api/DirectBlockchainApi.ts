import { Promise } from "bluebird";
import * as steem from "steem";

import { SteemPost } from "../blockchain/SteemPost";
import { SetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";

export class DirectBlockchainApi extends Api {
    private steem: any;
    private username: string;
    private postingWif: string;

    public constructor(username: string, postingWif: string, steemOptions?: object) {
        super();

        this.steem = steem;
        this.username = username;
        this.postingWif = postingWif;

        if (steemOptions) this.steem.api.setOptions(steemOptions);
    }

    public name(): string {
        return "DirectBlockchainApi";
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise((resolve, reject) => {
            this.steem.api.getContent(author, permlink, function(error: Error, result: any) {
                if (error) reject(error);
                else if (result.id == 0) reject(new Error("This post does not exist"));
                else resolve(result as SteemPost);
            });
        });
    }

    public loadRulesets(delegator: string, voter: string, at: SteemOperationNumber, protocol: Protocol): Promise<SetRules> {
        return new Promise((resolve, reject) => {
            reject(new Error("Not implemented yet"));
        });
    }

    public streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any> {
        throw new Error("Not implemented yet");
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("Not implemented yet")));
    }
}