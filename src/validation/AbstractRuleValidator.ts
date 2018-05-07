import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc, smartvotes_rule } from "../schema/smartvotes.schema";
import { SteemPost, SteemPostJSONMetadata } from "../blockchain/blockchain-operations-types";

/**
 * Abstract class for Rule Validators. A rule validator is specific for
 * type smartvotes_rule (src/schema/rules.schema.ts). Switch for rule validation is
 * in RulesValidator.validateVoteOrder.
 */
export abstract class AbstractRuleValidator {
    public abstract validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule, post: SteemPost): Promise<boolean>;
}