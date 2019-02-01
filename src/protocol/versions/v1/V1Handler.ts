import { ProtocolVersionHandler } from "../ProtocolVersionHandler";
import { WiseOperation } from "../../WiseOperation";

import * as ajv from "ajv";
import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_ruleset, smartvotes_command_send_voteorder, smartvotes_command_confirm_votes } from "./smartvotes.schema";
import { SendVoteorder } from "../../SendVoteorder";
import { SetRules } from "../../SetRules";
import { Rule } from "../../../rules/Rule";
import { TagsRule } from "../../../rules/TagsRule";
import { AuthorsRule } from "../../../rules/AuthorsRule";
import { CustomRPCRule } from "../../../rules/CustomRPCRule";
import { EffectuatedWiseOperation } from "../../EffectuatedWiseOperation";
import { SteemOperationNumber, UnifiedSteemTransaction } from "steem-efficient-stream";
import { ConfirmVote } from "../../ConfirmVote";
import { WeightRule } from "../../../rules/WeightRule";
import { CustomJsonOperation, OperationWithDescriptor } from "steem";

const aajv: ajv.Ajv = new ajv();
aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
const validate = aajv.compile(require("./smartvotes.schema.json"));

export class V1Handler implements ProtocolVersionHandler {
    public static INTRODUCTION_OF_WISE_MOMENT: SteemOperationNumber = new SteemOperationNumber(21622860, 26, 0);

    public handleOrReject(transaction: UnifiedSteemTransaction): EffectuatedWiseOperation [] | undefined {
        if (transaction.block_num > 22710498) return undefined; // this protocol version is disabled for new transactions

        if (transaction.ops[0][0] != "custom_json" || (transaction.ops[0][1] as CustomJsonOperation).id != "smartvote") return undefined;

        if ((transaction.ops[0][1] as CustomJsonOperation).required_posting_auths.length != 1) return undefined; // must be authorized by single user

        const jsonObj = JSON.parse((transaction.ops[0][1] as CustomJsonOperation).json);
        if (!this.validateJSON(jsonObj)) return undefined;

        const smartvotesOp = jsonObj as smartvotes_operation;
        return this.transform(transaction, smartvotesOp, (transaction.ops[0][1] as CustomJsonOperation).required_posting_auths[0]);
    }

    private validateJSON(input: object): boolean {
        return validate(input) as boolean;
    }

    private transform(op: UnifiedSteemTransaction, smartvotesOp: smartvotes_operation, sender: string): EffectuatedWiseOperation [] | undefined {
        if (smartvotesOp.name == "set_rules") { // sort for every voter
            return this.transformSetRules(op, smartvotesOp, sender);
        }
        else if (smartvotesOp.name == "send_voteorder") {
            return this.transformSendVoteorder(op, smartvotesOp, sender);
        }
        else if (smartvotesOp.name == "confirm_votes") {
            return this.transformConfirmVotes(op, smartvotesOp, sender);
        }
        else return undefined;
    }

    private transformSetRules(op: UnifiedSteemTransaction, smartvotesOp: smartvotes_command_set_rules, sender: string): EffectuatedWiseOperation [] {
        const rulesPerVoter: [string, {name: string, rules: Rule []}[]][] = [];

        for (let i = 0; i < smartvotesOp.rulesets.length; i++) {
            const ruleset = smartvotesOp.rulesets[i];
            let create = true;
            for (let j = 0; j < rulesPerVoter.length; j++) {
                if (rulesPerVoter[j][0] === ruleset.voter) {
                    rulesPerVoter[j][1].push(this.transformRuleset(ruleset));
                    create = false;
                }
            }
            if (create) {
                rulesPerVoter.push([ruleset.voter, [this.transformRuleset(ruleset)]]);
            }
        }

        const out: EffectuatedWiseOperation [] = [];

        for (let i = 0; i < rulesPerVoter.length; i++) {
            const cmd: SetRules = {
                rulesets: rulesPerVoter[i][1]
            };

            out.push({
                moment: new SteemOperationNumber(op.block_num, op.transaction_num),
                transaction_id: op.transaction_id,
                timestamp: op.timestamp,

                voter: rulesPerVoter[i][0],
                delegator: sender,

                command: cmd
            } as EffectuatedWiseOperation);
        }

        return out;
    }

    private transformRuleset(ruleset: smartvotes_ruleset): {name: string, rules: Rule []} {
        const rules: Rule [] = [];

        for (let i = 0; i < ruleset.rules.length; i++) {
            const rule = ruleset.rules[i];
            if (rule.type === "tags") {
                if (rule.mode === "allow") rules.push(new TagsRule(TagsRule.Mode.ALLOW, rule.tags));
                else if (rule.mode === "deny") rules.push(new TagsRule(TagsRule.Mode.DENY, rule.tags));
                else if (rule.mode === "require") rules.push(new TagsRule(TagsRule.Mode.REQUIRE, rule.tags));
                else if (rule.mode === "any") rules.push(new TagsRule(TagsRule.Mode.ANY, rule.tags));
            }
            else if (rule.type === "authors") {
                if (rule.mode === "allow") rules.push(new AuthorsRule(AuthorsRule.Mode.ALLOW, rule.authors));
                else if (rule.mode === "deny") rules.push(new AuthorsRule(AuthorsRule.Mode.DENY, rule.authors));
            }
            else if (rule.type === "custom_rpc") {
                rules.push(new CustomRPCRule(rule.rpc_host, rule.rpc_port, rule.rpc_path, rule.rpc_method));
            }
        }

        rules.push(new WeightRule(
            /*min: */(ruleset.action == "flag" || ruleset.action == "upvote+flag") ? (-1 * ruleset.total_weight) : 0,
            /*max: */(ruleset.action == "upvote" || ruleset.action == "upvote+flag") ? (1 * ruleset.total_weight) : 0,
        ));

        return {name: ruleset.name, rules: rules};
    }

    private transformSendVoteorder(op: UnifiedSteemTransaction, smartvotesOp: smartvotes_command_send_voteorder, sender: string): EffectuatedWiseOperation [] {
        const cmd: SendVoteorder = {
            rulesetName: smartvotesOp.voteorder.ruleset_name,
            permlink: smartvotesOp.voteorder.permlink,
            author: smartvotesOp.voteorder.author,
            weight: smartvotesOp.voteorder.weight * (smartvotesOp.voteorder.type == "flag" ? -1 : 1)
        };
        return [{
            moment: new SteemOperationNumber(op.block_num, op.transaction_num),
            transaction_id: op.transaction_id,
            timestamp: op.timestamp,

            voter: sender,
            delegator: smartvotesOp.voteorder.delegator,

            command: cmd
        } as EffectuatedWiseOperation];
    }

    private transformConfirmVotes(op: UnifiedSteemTransaction, smartvotesOp: smartvotes_command_confirm_votes, sender: string): EffectuatedWiseOperation [] {
        const out: EffectuatedWiseOperation [] = [];

        for (let i = 0; i < smartvotesOp.voteorders.length; i++) {
            const confirmation = smartvotesOp.voteorders[i];

            const cmd: ConfirmVote = {
                voteorderTxId: confirmation.transaction_id,
                accepted: !confirmation.invalid,
                msg: ""
            };

            out.push({
                moment: new SteemOperationNumber(op.block_num, op.transaction_num),
                transaction_id: op.transaction_id,
                timestamp: op.timestamp,

                voter: "unknown",
                delegator: sender,

                command: cmd
            } as EffectuatedWiseOperation);
        }

        return out;
    }

    public serializeToBlockchain(op: WiseOperation): OperationWithDescriptor [] {
        throw new Error("Protocol version V1 is disabled");
    }
}