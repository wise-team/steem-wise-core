import { Promise } from "bluebird";

import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc } from "../schema/smartvotes.schema";
import { SteemPost, SteemPostJSONMetadata } from "../types/blockchain-operations-types";
import { AbstractRuleValidator } from "./AbstractRuleValidator";
/**
 * Validator for smartvotes_rule_custom_rpc (defined in src/schema/rules.schema.ts).
 */
export class CustomRPCRuleValidator extends AbstractRuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_custom_rpc, post: SteemPost): Promise<boolean> {
        throw new Error("Not yet supported");
    }
}