import * as schema from "./schema/smartvotes.schema";
import { CustomJsonOperation, VoteOperation } from "./types/blockchain-operations-types";
import { JSONValidator } from "./validation/JSONValidator";
import { RulesValidator } from "./validation/RulesValidator";

const steem = require("steem");

// TODO comment
export class SteemSmartvotes {
    private username: string;
    private postingWif: string;

    constructor(username: string, postingWif: string) {
        this.username = username;
        this.postingWif = postingWif;

        if (username.length == 0 || postingWif.length == 0) throw new Error("Credentials cannot be empty");
    }

    // TODO comment
    public static validateVoteOrder(username: string, voteorder: schema.smartvotes_voteorder, beforeDate: Date,
        callback: (error: Error | undefined, result: boolean) => void,
        progressCallback: (msg: string, proggress: number) => void = function(msg, percent) {}): void {
        RulesValidator.validateVoteOrder(username, voteorder, beforeDate, callback, progressCallback);
    }

    // TODO comment
    // TODO move to separate file
    // TODO validate
    public sendVoteOrder(voteorder: schema.smartvotes_voteorder, callback: (error: Error, result: any) => void): void {
        const jsonStr = JSON.stringify({name: "send_voteorder", voteorder: voteorder});
        if (!SteemSmartvotes.validateJSON(jsonStr)) throw new Error("Vote order command JSON is invalid: " + jsonStr);

        const voteOp: VoteOperation = {
            voter: this.username,
            author: voteorder.author,
            permlink: voteorder.permlink,
            weight: voteorder.weight
        };

        const customJsonOp: CustomJsonOperation = {
            required_auths: [],
            required_posting_auths: [this.username],
            id: "smartvote",
            json: jsonStr
        };

        const steemCallback = function(err: Error, result: any): void {
            callback(err, result);
        };

        steem.broadcast.send(
            {
                extensions: [],
                operations: [
                                ["vote", voteOp],
                                ["custom_json", customJsonOp]
                            ]
            },
            {posting: this.postingWif},
            steemCallback
        );
    }

    // TODO comment
    // TODO move to separate file
    // TODO reject duplicate names
    public sendRulesets(rulesets: schema.smartvotes_ruleset [], callback: (error: Error, result: any) => void): void {
        const smartvotesOp: schema.smartvotes_operation = {name: "set_rules", rulesets: rulesets};
        const jsonStr = JSON.stringify(smartvotesOp);
        if (!SteemSmartvotes.validateJSON(jsonStr)) throw new Error("Set_rulesets command JSON is invalid: " + jsonStr);

        const customJsonOp: CustomJsonOperation = {
            required_auths: [],
            required_posting_auths: [this.username],
            id: "smartvote",
            json: jsonStr
        };

        const steemCallback = function(err: Error, result: any): void {
            callback(err, result);
        };

        // steem.api.setOptions({ url: "https://gtg.steem.house:8090", uri: "https://gtg.steem.house:8090" });

        steem.broadcast.send(
            {
                extensions: [],
                operations: [
                    ["custom_json", customJsonOp]
                ]
            },
            {posting: this.postingWif},
            steemCallback
        );
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