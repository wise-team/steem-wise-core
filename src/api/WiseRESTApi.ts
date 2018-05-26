import { SteemPost } from "../blockchain/SteemPost";
import { SetRules } from "../protocol/SetRules";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { ChainableSupplier } from "../chainable/Chainable";
import { SteemOperation } from "../blockchain/SteemOperation";
import { Api } from "./Api";

export class WiseRESTApi extends Api {
    public constructor(username: string, postingWif: string, steemOptions: object | undefined = undefined) {
        super();
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        throw new Error("Not implemented yet");
    }

    public loadRulesets(delegator: string, voter: string, at: SteemOperationNumber): Promise<SetRules> {
        throw new Error("Not implemented yet");
    }

    public streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any> {
        throw new Error("Not implemented yet");
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        throw new Error("Not implemented yet");
    }
}