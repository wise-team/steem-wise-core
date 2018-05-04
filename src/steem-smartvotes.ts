import * as steem from "steem";

import * as schema from "./schema/smartvotes.schema";
import { BlockchainSender } from "./BlockchainSender";
import { JSONValidator } from "./validation/JSONValidator";
import { RulesValidator } from "./validation/RulesValidator";
import { BlockchainFilter } from "./BlockchainFilter";

// TODO comment
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
    public static validateVoteOrder(username: string, voteorder: schema.smartvotes_voteorder, beforeDate: Date,
        callback: (error: Error | undefined, result: boolean) => void,
        progressCallback: (msg: string, proggress: number) => void = function(msg, percent) {}): void {
        RulesValidator.validateVoteOrder(username, voteorder, beforeDate, callback, progressCallback);
    }

    // TODO comment
    public sendVoteOrder(voteorder: schema.smartvotes_voteorder, callback: (error: Error | undefined, result: any) => void): void {
        BlockchainSender.sendVoteOrder(this.steem, this.username, this.postingWif, voteorder, callback);
    }

    // TODO comment
    public sendRulesets(rulesets: schema.smartvotes_ruleset [], callback: (error: Error | undefined, result: any) => void): void {
        BlockchainSender.sendRulesets(this.steem, this.username, this.postingWif, rulesets, callback);
    }

    // TODO comment
    public static getRulesetsOfUser(username: string, atTime: Date, callback: (error: Error | undefined, result: schema.smartvotes_ruleset []) => void): void {
        RulesValidator.getRulesOfUser(username, atTime, callback);
    }

    // TODO comment
    // TODO implement
    public loadSmartvotesOperationsOfAccount(username: string, callback: (error: Error | undefined, result: schema.smartvotes_operation []) => void): void {
        BlockchainFilter.getSmartvotesOperationsOfUser(username, callback);
    }

    // TODO comment
    public static validateJSON(input: string): boolean {
        return JSONValidator.validateJSON(input);
    }
}

export default SteemSmartvotes;
export * from "./schema/smartvotes.schema";