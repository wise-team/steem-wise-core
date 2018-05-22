import * as steem from "steem";

import * as schema from "./schema/smartvotes.schema";
import { BlockchainSender } from "./blockchain/BlockchainSender";
import { Synchronizer, SynchronizationResult } from "./blockchain/Synchronizer";
import { JSONValidator } from "./validation/JSONValidator";
import { RulesValidator } from "./validation/RulesValidator";
import { ApiFactory } from "./api/ApiFactory";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { VoteorderAtMoment, RulesetsAtMoment, VoteConfirmedAtMoment } from "./validation/smartvote-types-at-moment";
import { SteemJsApiFactory } from "./api/SteemJsApiFactory";
import { ChainableSupplier } from "./chainable/Chainable";
import { RawOperation } from "./blockchain/blockchain-operations-types";

// TODO semver

// TODO comment
// TODO blockchain input sanitization (prevent malicious json)
export class SteemSmartvotes {
    private steem: any;
    private username: string;
    private postingWif: string;
    private apiFactory: ApiFactory;

    constructor(username: string, postingWif: string, steemOptions: object | undefined = undefined, apiFactory?: ApiFactory) {
        this.username = username;
        this.postingWif = postingWif;
        this.steem = steem;

        if (steemOptions) this.steem.api.setOptions(steemOptions);

        if (apiFactory) {
            this.apiFactory = apiFactory;
        }
        else {
            this.apiFactory = new SteemJsApiFactory(this.steem, 1000);
        }

        if (username.length == 0 || postingWif.length == 0) throw new Error("Credentials cannot be empty");
    }

    public setApiFactory(apiFactory: ApiFactory): void {
        this.apiFactory = apiFactory;
    }

    // TODO comment
    public validateVoteOrder = (username: string, voteorder: schema.smartvotes_voteorder, atMoment: SteemOperationNumber,
        callback: (error: Error | undefined, result: boolean) => void,
        progressCallback: (msg: string, proggress: number) => void = function(msg, percent) {}): void => {
        new RulesValidator(this.steem, this.apiFactory).validateVoteOrder(username, voteorder, atMoment, callback, progressCallback);
    }

    // TODO comment
    public sendVoteOrder = (voteorder: schema.smartvotes_voteorder,
        callback: (error: Error | undefined, result: any) => void,
        proggressCallback?: (msg: string, proggress: number) => void, skipValidation?: boolean): void => {
        if (proggressCallback)
            BlockchainSender.sendVoteOrder(this.steem, this.apiFactory, this.username, this.postingWif, voteorder, callback, proggressCallback, (skipValidation ? true : false));
        else
            BlockchainSender.sendVoteOrder(this.steem, this.apiFactory, this.username, this.postingWif, voteorder, callback);
    }

    // TODO comment
    public sendRulesets = (rulesets: schema.smartvotes_ruleset [], callback: (error: Error | undefined, result: any) => void): void => {
        BlockchainSender.sendRulesets(this.steem, this.username, this.postingWif, rulesets, callback);
    }

    // TODO comment
    public getRulesetsOfUser = (username: string, callback: (error: Error | undefined, result: schema.smartvotes_ruleset []) => void, atMoment: SteemOperationNumber = SteemOperationNumber.FUTURE): void => {
        new RulesValidator(this.steem, this.apiFactory).getRulesOfUser(username, atMoment)
        .then((result: schema.smartvotes_ruleset []) => callback(undefined, result))
        .catch((error: Error) => callback(error, []));
    }

    public synchronizeSmartvotes = (callback: (error: Error | undefined, result: SynchronizationResult | undefined) => void, proggressCallback: ((msg: string, proggress: number) => void) = () => {}, concurrency: number = 4): void => {
        new Synchronizer(this.steem, this.apiFactory, this.username, this.postingWif).withConcurrency(concurrency).withProggressCallback(proggressCallback).synchronize(callback);
    }

    // TODO comment
    public createAccountHistoryChain = (username: string): ChainableSupplier<RawOperation, any> => {
        return this.apiFactory.createSmartvotesSupplier(username);
    }

    // TODO comment
    // TODO implement
    public createLiveBlockchainChain = (username: string): ChainableSupplier<RawOperation, any> => {
        throw new Error("Not implemented yet");
    }

    // TODO comment
    public static validateJSON = (input: string): boolean => {
        return JSONValidator.validateJSON(input);
    }
}

export default SteemSmartvotes;
export * from "./schema/smartvotes.schema";
export * from "./blockchain/_exports";
export * from "./chainable/_exports";
