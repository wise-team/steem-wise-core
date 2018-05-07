import * as schema from "./schema/smartvotes.schema";
import { CustomJsonOperation, VoteOperation } from "./types/blockchain-operations-types";
import { JSONValidator } from "./validation/JSONValidator";
import { RulesValidator } from "./validation/RulesValidator";

import { Promise } from "bluebird";

// TODO move to /blockchain
export class BlockchainSender {
    // TODO comment
    // TODO add proggress callback
    // TODO validate
    public static sendVoteOrder(steem: any, username: string, postingWif: string, voteorder: schema.smartvotes_voteorder,
        callback: (error: Error | undefined, result: any) => void,
        proggressCallback?: (msg: string, proggress: number) => void): void {

        const notifyProggress = function(msg: string, proggress: number) {
            if (proggressCallback) proggressCallback(msg, proggress);
        };

        const validateJSON = function(): Promise<string> {
            return new Promise(function(resolve, reject) {
                const jsonStr: string = JSON.stringify({name: "send_voteorder", voteorder: voteorder});
                if (!JSONValidator.validateJSON(jsonStr)) throw new Error("Vote order command JSON is invalid: " + jsonStr);
                resolve(jsonStr);
            });
        };

        const validateRules  = (jsonStr: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                new RulesValidator(steem).validateVoteOrder(username, voteorder, new Date(), function(error, success) {
                    if (error) reject(error);
                    else {
                        notifyProggress("Sending vote order to blockchain", 0.8);
                        resolve(jsonStr);
                    }
                }, function(msg: string, proggress: number) {
                    notifyProggress(msg, proggress * 0.8); // validation takes 80% of proggress
                });
            });
        };

        const doSend = function(jsonStr: string): Promise<string> {
            return new Promise(function(resolve, reject) {
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
            });
        };

        validateJSON()
        .then(validateRules)
        .then(doSend)
        .then(function(result: any) { callback(undefined, result); })
        .catch(error => { callback(error, undefined); });
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

        // console.log("Sending " + jsonStr.length + " chars.");
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