import { Promise } from "bluebird";
import * as fs from "fs";
import * as path from "path";

import { SteemPost } from "../../src/blockchain/SteemPost";
import { SetRules } from "../../src/protocol/SetRules";
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../../src/chainable/Chainable";
import { SteemOperation } from "../../src/blockchain/SteemOperation";
import { Api } from "../../src/api/Api";
import { Protocol } from "../../src/protocol/Protocol";
import { DirectBlockchainApi } from "../../src/api/directblockchain/DirectBlockchainApi";

// TODO implement and use in tests
export class FakeApi extends Api {
    private data: [string, any];
    public constructor() {
        super();

        this.data = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/operations/fake-blockchain.operations.json")));
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

    public streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any> {
        throw new Error("This api is disabled");
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise((resolve, reject) => reject(new Error("This api is disabled")));
    }

    private getAccountOperations(username: string): any {
        for (const acc of this.data) {
            if (acc[0] === username) {
                return acc[1];
            }
        }
        throw new Error("No such account in fake blockchain");
    }
}