import { Promise } from "bluebird";

import { SteemPost } from "../blockchain/SteemPost";
import { SetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";
import { DirectBlockchainApi } from "./directblockchain/DirectBlockchainApi";
import axios from "axios";

export class DisabledApi extends Api {
    public constructor() {
        super();
    }

    public name(): string {
        return "DisabledApi";
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public loadRulesets(delegator: string, voter: string, at: SteemOperationNumber): Promise<SetRules> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any> {
        throw new Error("This api is disabled");
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }
}