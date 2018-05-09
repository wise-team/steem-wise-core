import * as steem from "steem";

import * as schema from "./schema/smartvotes.schema";
import { BlockchainSender } from "./blockchain/BlockchainSender";
import { Synchronizer } from "./blockchain/Synchronizer";
import { JSONValidator } from "./validation/JSONValidator";
import { RulesValidator } from "./validation/RulesValidator";
import { AccountHistorySupplier } from "./chainable/_exports";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { VoteorderAtMoment } from "./validation/smartvote-types-at-moment";

// TODO comment
// TODO blockchain input sanitization
export class SteemSmartvotes {
    private steem: any;
    private username: string;
    private postingWif: string;

    constructor(username: string, postingWif: string, steemOptions: object | undefined = undefined) {
        this.username = username;
        this.postingWif = postingWif;

        this.steem = steem;
        // TODO use this steem (with these options in static methods of this class (make them non-static)).
        if (steemOptions) this.steem.api.setOptions(steemOptions);

        if (username.length == 0 || postingWif.length == 0) throw new Error("Credentials cannot be empty");
    }

    // TODO comment
    public validateVoteOrder = (username: string, voteorder: schema.smartvotes_voteorder, atMoment: SteemOperationNumber,
        callback: (error: Error | undefined, result: boolean) => void,
        progressCallback: (msg: string, proggress: number) => void = function(msg, percent) {}): void => {
        new RulesValidator(this.steem).validateVoteOrder(username, voteorder, atMoment, callback, progressCallback);
    }

    // TODO comment
    public sendVoteOrder = (voteorder: schema.smartvotes_voteorder,
        callback: (error: Error | undefined, result: any) => void,
        proggressCallback?: (msg: string, proggress: number) => void): void => {
        if (proggressCallback)
            BlockchainSender.sendVoteOrder(this.steem, this.username, this.postingWif, voteorder, callback, proggressCallback);
        else
            BlockchainSender.sendVoteOrder(this.steem, this.username, this.postingWif, voteorder, callback);
    }

    // TODO comment
    public sendRulesets = (rulesets: schema.smartvotes_ruleset [], callback: (error: Error | undefined, result: any) => void): void => {
        BlockchainSender.sendRulesets(this.steem, this.username, this.postingWif, rulesets, callback);
    }

    // TODO comment
    public getRulesetsOfUser = (username: string, callback: (error: Error | undefined, result: schema.smartvotes_ruleset []) => void, atMoment: SteemOperationNumber = SteemOperationNumber.FUTURE): void => {
        new RulesValidator(this.steem).getRulesOfUser(username, atMoment)
        .then((result: schema.smartvotes_ruleset []) => callback(undefined, result))
        .catch((error: Error) => callback(error, []));
    }

    public synchronizeSmartvotes = (callback: (error: Error | undefined, result: VoteorderAtMoment [] | undefined) => void, proggressCallback: ((msg: string, proggress: number) => void) = () => {}, concurrency: number = 4): void => {
        new Synchronizer(this.steem, this.username, this.postingWif).withConcurrency(concurrency).withProggressCallback(proggressCallback).synchronize(callback);
    }

    // TODO comment
    public createAccountHistoryChain = (username: string): AccountHistorySupplier => {
        return new AccountHistorySupplier(this.steem, username);
    }

    // TODO comment
    // TODO implement
    public createLiveBlockchainChain = (username: string): AccountHistorySupplier => {
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

