import { Promise } from "bluebird";

import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc } from "../schema/smartvotes.schema";
import { SteemPost, SteemPostJSONMetadata } from "../types/blockchain-operations-types";
import { AbstractRuleValidator } from "./AbstractRuleValidator";

/**
 * Validator for smartvotes_rule_tags (defined in src/schema/rules.schema.ts).
 */
export class TagsRuleValidator extends AbstractRuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_tags, post: SteemPost): Promise<boolean> {
        return new Promise(function(resolve, reject) {
            const postMetadata: SteemPostJSONMetadata = JSON.parse(post.json_metadata) as SteemPostJSONMetadata;
            const allowMode = (rule.mode == "allow");

            if (allowMode) {
                for (const i in postMetadata.tags) {
                    const tag = postMetadata.tags[i];
                    if (rule.tags.indexOf(tag) === -1)
                            throw new Error("Tag " + tag + " is not on the allowed tags list [" + rule.tags.join() + "].");
                }
                resolve(true);
            }
            else { // deny mode
                for (const i in rule.tags) {
                    const tag = postMetadata.tags[i];
                    if (rule.tags.indexOf(tag) !== -1)
                            throw new Error("Tag " + tag + " is on the denied tags list [" + rule.tags.join() + "].");
                }
                resolve(true);
            }
        });
    }
}