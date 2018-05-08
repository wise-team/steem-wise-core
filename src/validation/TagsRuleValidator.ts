import { Promise } from "bluebird";

import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc } from "../schema/smartvotes.schema";
import { SteemPost, SteemPostJSONMetadata } from "../blockchain/blockchain-operations-types";
import { AbstractRuleValidator } from "./AbstractRuleValidator";
import { ValidationError } from "./ValidationError";

/**
 * Validator for smartvotes_rule_tags (defined in src/schema/rules.schema.ts).
 */
export class TagsRuleValidator extends AbstractRuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_tags, post: SteemPost): Promise<boolean> {
        return new Promise(function(resolve, reject) {
            const postMetadata: SteemPostJSONMetadata = JSON.parse(post.json_metadata) as SteemPostJSONMetadata;
            const allowMode = (rule.mode == "allow");

            if (rule.mode === "allow") { // allow mode (every post tag must be within this list)
                for (let i = 0; i < postMetadata.tags.length; i++) {
                    const tag = postMetadata.tags[i];
                    if (rule.tags.indexOf(tag) === -1)
                            throw new ValidationError("Tag " + tag + " is not on the allowed tags list [" + rule.tags.join() + "].");
                }
                resolve(true);
            }
            else if (rule.mode === "deny") { // deny mode (none of post tags can be on this list)
                for (let i = 0; i < postMetadata.tags.length; i++) {
                    const tag = postMetadata.tags[i];
                    if (rule.tags.indexOf(tag) !== -1)
                            throw new ValidationError("Tag " + tag + " is on the denied tags list [" + rule.tags.join() + "].");
                }
                resolve(true);
            }
            else if (rule.mode === "require") { // the post should have all of the specified tags
                for (let i = 0; i < rule.tags.length; i++) {
                    const tag = rule.tags[i];
                    if (postMetadata.tags.indexOf(tag) === -1)
                        throw new ValidationError("The post tags [" + postMetadata.tags.join() + "] does not include " + tag + ".");
                }
                resolve(true);
            }
            else if (rule.mode === "any") { // the post should have at least one of the specified tags
                for (let i = 0; i < rule.tags.length; i++) {
                    const tag = rule.tags[i];
                    if (postMetadata.tags.indexOf(tag) !== -1) {
                        resolve(true);
                        return;
                    }
                }
                throw new ValidationError("None of the tags [" + postMetadata.tags.join() + "] is on the \"require\" tags list [" + rule.tags.join() + "].");
            }
            else throw new ValidationError("Unknown mode in tags rule.");
        });
    }
}