import * as schema from "./schema/smartvotes.schema";
import { BlockchainSender } from "./BlockchainSender";
import { JSONValidator } from "./validation/JSONValidator";
import { RulesValidator } from "./validation/RulesValidator";

// TODO comment
export class SteemSmartvotes {
    private steem: any;
    private username: string;
    private postingWif: string;

    constructor(username: string, postingWif: string) {
        this.username = username;
        this.postingWif = postingWif;

        this.steem = require("steem"); // TODO generate type definitions and turn on definition generation for this library in tsconfig.

        if (username.length == 0 || postingWif.length == 0) throw new Error("Credentials cannot be empty");
    }

    // TODO comment
    public static validateVoteOrder(username: string, voteorder: schema.smartvotes_voteorder, beforeDate: Date,
        callback: (error: Error | undefined, result: boolean) => void,
        progressCallback: (msg: string, proggress: number) => void = function(msg, percent) {}): void {
        RulesValidator.validateVoteOrder(username, voteorder, beforeDate, callback, progressCallback);
    }

    // TODO comment
    public sendVoteOrder(voteorder: schema.smartvotes_voteorder, callback: (error: Error, result: any) => void): void {
        BlockchainSender.sendVoteOrder(this.steem, this.username, this.postingWif, voteorder, callback);
    }

    // TODO comment
    public sendRulesets(rulesets: schema.smartvotes_ruleset [], callback: (error: Error, result: any) => void): void {
        BlockchainSender.sendRulesets(this.steem, this.username, this.postingWif, rulesets, callback);
    }

    // TODO comment
    public static getRulesetsOfUser(username: string, beforeDate: Date, callback: (error: Error | undefined, result: schema.smartvotes_ruleset []) => void): void {
        RulesValidator.getRulesOfUser(username, beforeDate, callback);
    }

    // TODO comment
    // TODO implement
    public loadSmartvotesOperationsOfAccount(username: string, callback: (error: Error, result: schema.smartvotes_operation []) => void): void {
        throw new Error("Not implemented yet");
    }

    // TODO comment
    public static validateJSON(input: string): boolean {
        return JSONValidator.validateJSON(input);
    }
}

export default SteemSmartvotes;
export * from "./schema/smartvotes.schema";