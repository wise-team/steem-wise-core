import { Promise } from "bluebird";

import { SteemPost } from "../blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";
import { Api } from "./Api";
import { Protocol } from "../protocol/Protocol";
import { DirectBlockchainApi } from "./directblockchain/DirectBlockchainApi";
import { EffectuatedSmartvotesOperation } from "../protocol/EffectuatedSmartvotesOperation";

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

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public loadAllRulesets(delegator: string, at: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getLastConfirmationMoment(delegator: string): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number): Promise<EffectuatedSmartvotesOperation []> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }
}