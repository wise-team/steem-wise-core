import { Promise } from "bluebird";
import * as fs from "fs";
import * as path from "path";

import { SteemPost } from "../../src/blockchain/SteemPost";
import { SetRules, EffectuatedSetRules } from "../../src/protocol/SetRules";
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../../src/chainable/Chainable";
import { SteemOperation } from "../../src/blockchain/SteemOperation";
import { Api } from "../../src/api/Api";
import { Protocol } from "../../src/protocol/Protocol";
import { DirectBlockchainApi } from "../../src/api/directblockchain/DirectBlockchainApi";
import { EffectuatedSmartvotesOperation } from "../../src/protocol/EffectuatedSmartvotesOperation";
import { DynamicGlobalProperties } from "../../src/blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../../src/blockchain/AccountInfo";

// TODO implement and use in tests
export class FakeApi extends Api {
    private data: [string, any];
    public constructor() {
        super();

        this.data = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/operations/fake-blockchain.operations.json"), "UTF-8"));
    }

    public name(): string {
        return "FakeApi";
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

    public getDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    public getAccountInfo(username: string): Promise<AccountInfo> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }
}