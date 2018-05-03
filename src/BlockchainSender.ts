import * as schema from "./schema/smartvotes.schema";
import { CustomJsonOperation, VoteOperation } from "./types/blockchain-operations-types";
import { JSONValidator } from "./validation/JSONValidator";
import { RulesValidator } from "./validation/RulesValidator";

export class BlockchainSender {
    // TODO comment
    // TODO add proggress callback
    // TODO validate
    public static sendVoteOrder(steem: any, username: string, postingWif: string, voteorder: schema.smartvotes_voteorder, callback: (error: Error, result: any) => void): void {
        const jsonStr = JSON.stringify({name: "send_voteorder", voteorder: voteorder});
        if (!JSONValidator.validateJSON(jsonStr)) throw new Error("Vote order command JSON is invalid: " + jsonStr);

        const voteOp: VoteOperation = {
            voter: username,
            author: voteorder.author,
            permlink: voteorder.permlink,
            weight: voteorder.weight
        };

        const customJsonOp: CustomJsonOperation = {
            required_auths: [],
            required_posting_auths: [username],
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
            {posting: postingWif},
            steemCallback
        );
    }

    // TODO comment
    // TODO add proggress callback
    // TODO reject duplicate names
    public static sendRulesets(steem: any, username: string, postingWif: string, rulesets: schema.smartvotes_ruleset [], callback: (error: Error, result: any) => void): void {
        const smartvotesOp: schema.smartvotes_operation = {name: "set_rules", rulesets: rulesets};
        const jsonStr = JSON.stringify(smartvotesOp);
        if (!JSONValidator.validateJSON(jsonStr)) throw new Error("Set_rulesets command JSON is invalid: " + jsonStr);

        const customJsonOp: CustomJsonOperation = {
            required_auths: [],
            required_posting_auths: [username],
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
            {posting: postingWif},
            steemCallback
        );
    }
}