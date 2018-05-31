import { ProtocolVersionHandler } from "../ProtocolVersionHandler";
import { SmartvotesOperation } from "../../SmartvotesOperation";

import * as ajv from "ajv";
import * as schemaJSON from "./wise.schema.json";
import { SendVoteorder, isSendVoteorder } from "../../SendVoteorder";
import { SetRules, isSetRules } from "../../SetRules";
import { Rule } from "../../../rules/Rule";
import { TagsRule } from "../../../rules/TagsRule";
import { AuthorsRule } from "../../../rules/AuthorsRule";
import { CustomRPCRule } from "../../../rules/CustomRPCRule";
import { SteemOperation } from "../../../blockchain/SteemOperation";
import { CustomJsonOperation } from "../../../blockchain/CustomJsonOperation";
import { EffectuatedSmartvotesOperation } from "../../EffectuatedSmartvotesOperation";
import { SteemOperationNumber } from "../../../blockchain/SteemOperationNumber";
import { isConfirmVote, ConfirmVote } from "../../ConfirmVote";
import { wise_operation, wise_set_rules, wise_rule, wise_send_voteorder_operation, wise_set_rules_operation, wise_confirm_vote_operation } from "./wise-schema";
import { wise_rule_decode, wise_rule_encode } from "./rules-schema";

class WiseConstants {
    public static wise_send_voteorder_descriptor: string = "v2:send_voteorder";
    public static wise_set_rules_descriptor: string = "v2:set_rules";
    public static wise_confirm_vote_descriptor: string = "v2:confirm_vote";
    public static wise_descriptors: string [] = [
        WiseConstants.wise_send_voteorder_descriptor,
        WiseConstants.wise_set_rules_descriptor,
        WiseConstants.wise_confirm_vote_descriptor
    ];
}

const aajv: ajv.Ajv = new ajv();
aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

const validate = aajv.compile(schemaJSON);

export class V2Handler implements ProtocolVersionHandler {
    public static CUSTOM_JSON_ID = "wise";

    public handleOrReject = (op: SteemOperation): EffectuatedSmartvotesOperation [] | undefined => {
        if (op.block_num <= 22710498) return undefined;

        if (op.op[0] != "custom_json" || (op.op[1] as CustomJsonOperation).id != V2Handler.CUSTOM_JSON_ID) return undefined;

        if ((op.op[1] as CustomJsonOperation).required_posting_auths.length != 1) return undefined; // must be authorized by single user

        if (!this.isMyOperation((op.op[1] as CustomJsonOperation).json)) return undefined;

        const jsonObj = JSON.parse((op.op[1] as CustomJsonOperation).json);
        if (!this.validateJSON(jsonObj)) return undefined;

        const wiseOp = jsonObj as wise_operation;

        return this.decode(op, wiseOp, (op.op[1] as CustomJsonOperation).required_posting_auths[0]);
    }

    private isMyOperation = (jsonStr: string): boolean => {
        const descriptorStart = jsonStr.indexOf("\"") + 1;
        const descriptor = jsonStr.substring(descriptorStart, jsonStr.indexOf("\"", descriptorStart));
        return WiseConstants.wise_descriptors.indexOf(descriptor) !== -1;
    }

    private validateJSON = (input: object): boolean => {
        
        return validate(input) as boolean;
    }

    private decode = (op: SteemOperation, wiseOp: wise_operation, sender: string): EffectuatedSmartvotesOperation [] | undefined => {
        if (wiseOp[0] == WiseConstants.wise_confirm_vote_descriptor) {
            return this.decodeConfirmVote(op, wiseOp as wise_confirm_vote_operation, sender);
        }
        if (wiseOp[0] == WiseConstants.wise_set_rules_descriptor) {
            return this.decodeSetRules(op, wiseOp as wise_set_rules_operation, sender);
        }
        else if (wiseOp[0] == WiseConstants.wise_send_voteorder_descriptor) {
            return this.decodeSendVoteorder(op, wiseOp as wise_send_voteorder_operation, sender);
        }
        else return undefined;
    }

    private decodeSetRules = (op: SteemOperation, wiseOp: wise_set_rules_operation, sender: string): EffectuatedSmartvotesOperation [] => {
        const rulesets: { name: string, rules: Rule []} [] = [];

        for (let i = 0; i < (wiseOp[1] as wise_set_rules).rulesets.length; i++) {
            const ruleset: [string, wise_rule []] = (wiseOp[1] as wise_set_rules).rulesets[i];
            rulesets.push(this.decodeRuleset(ruleset));
        }

        const out: EffectuatedSmartvotesOperation = {
            moment: new SteemOperationNumber(op.block_num, op.transaction_num, op.operation_num),
            transaction_id: op.transaction_id,
            timestamp: op.timestamp,

            voter: (wiseOp[1] as wise_set_rules).voter,
            delegator: sender,

            command: {
                rulesets: rulesets
            } as SetRules
        };

        return [out];
    }

    private decodeRuleset = (ruleset: [string, wise_rule []]): {name: string, rules: Rule []} => {
        const rules: Rule [] = [];

        for (let i = 0; i < ruleset[1].length; i++) {
            const rule = ruleset[1][i];
            const decodeed = wise_rule_decode(rule);
            if (decodeed) rules.push(decodeed);
        }

        return {name: ruleset[0], rules};
    }

    private decodeSendVoteorder = (op: SteemOperation, wiseOp: wise_send_voteorder_operation, sender: string): EffectuatedSmartvotesOperation [] => {
        const cmd: SendVoteorder = {
            rulesetName: wiseOp[1].ruleset,
            permlink: wiseOp[1].permlink,
            author: wiseOp[1].author,
            weight: wiseOp[1].weight
        };
        return [{
            moment: new SteemOperationNumber(op.block_num, op.transaction_num, op.operation_num),
            transaction_id: op.transaction_id,
            timestamp: op.timestamp,

            voter: sender,
            delegator: wiseOp[1].delegator,

            command: cmd
        } as EffectuatedSmartvotesOperation];
    }

    private decodeConfirmVote = (op: SteemOperation, wiseOp: wise_confirm_vote_operation, sender: string): EffectuatedSmartvotesOperation [] => {
        const cmd: ConfirmVote = {
            voteorderTxId: wiseOp[1].tx_id,
            accepted: wiseOp[1].accepted,
            msg: wiseOp[1].msg,
        };
        return [{
            moment: new SteemOperationNumber(op.block_num, op.transaction_num, op.operation_num),
            transaction_id: op.transaction_id,
            timestamp: op.timestamp,

            voter: wiseOp[1].voter,
            delegator: sender,

            command: cmd
        } as EffectuatedSmartvotesOperation];
    }

    public serializeToBlockchain = (op: SmartvotesOperation): [string, object][] => {
        let senderUsername = "";
        let jsonObj: wise_operation;

        if (isSetRules(op.command)) {
            senderUsername = op.delegator;

            const rulesets: [string, wise_rule []] [] = [];

            for (let i = 0; i < op.command.rulesets.length; i++) {
                const ruleset = op.command.rulesets[i];
                rulesets.push(this.serializeRuleset(ruleset));
            }

            jsonObj = ["v2:set_rules", {
                voter: op.voter,
                rulesets: rulesets
            }];
        }
        else if (isSendVoteorder(op.command)) {
            senderUsername = op.voter;
            jsonObj = ["v2:send_voteorder", {
                delegator: op.delegator,
                ruleset: op.command.rulesetName,
                author: op.command.author,
                permlink: op.command.permlink,
                weight: op.command.weight
            }];
        }
        else if (isConfirmVote(op.command)) {
            senderUsername = op.delegator;
            jsonObj = ["v2:confirm_vote", {
                voter: op.voter,
                tx_id: op.command.voteorderTxId,
                accepted: op.command.accepted,
                msg: op.command.msg
            }];
        }
        else throw new Error("Unknown type of command");

        return [["custom_json", {
            id: V2Handler.CUSTOM_JSON_ID,
            json: JSON.stringify(jsonObj),
            required_auths: [],
            required_posting_auths: [ senderUsername ]
        } as CustomJsonOperation]];
    }

    private serializeRuleset = (r: { name: string, rules: Rule [] }): [string, wise_rule []] => {
        const out: wise_rule [] = [];
        for (let i = 0; i < r.rules.length; i++) {
            const rule = r.rules[i];
            out.push(wise_rule_encode(rule));
        }
        return [r.name, out];
    }
}