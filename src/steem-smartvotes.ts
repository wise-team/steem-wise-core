import * as schema from "./schema/smartvotes.schema";
import { CustomJsonOperation, VoteOperation } from "./blockchain-operations-types";
import { Validator } from "./Validator";

const steem = require("steem");

export class SteemSmartvotes {
    private username: string;
    private postingWif: string;

    constructor(username: string, postingWif: string) {
        this.username = username;
        this.postingWif = postingWif;

        if (username.length == 0 || postingWif.length == 0) throw new Error("Credentials cannot be empty");
    }

    public validateVoteOrder(voteorder: schema.smartvotes_voteorder): boolean {
        console.error("Vote validation is not yet supported. It is now returning true in every case.");
        return true;
    }

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

    public getRules(): schema.smartvotes_ruleset [] {
        throw new Error("Not implemented yet");
    }

    public loadSmartvotesOperationsOfAccount(username: string, callback: (error: Error, result: schema.smartvotes_operation []) => void): void {
        throw new Error("Not implemented yet");
    }

    public static validateJSON(input: string): boolean {
        return Validator.validateJSON(input);
    }
}

export default SteemSmartvotes;
export * from "./schema/smartvotes.schema";