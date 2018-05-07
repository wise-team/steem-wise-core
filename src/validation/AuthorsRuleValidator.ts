import { Promise } from "bluebird";

import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc } from "../schema/smartvotes.schema";
import { SteemPost, SteemPostJSONMetadata } from "../blockchain/blockchain-operations-types";
import { AbstractRuleValidator } from "./AbstractRuleValidator";

/**
 * Validator for smartvotes_rule_authors (defined in src/schema/rules.schema.ts).
 */
export class AuthorsRuleValidator extends AbstractRuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_authors, post: SteemPost): Promise<boolean> {
        return new Promise(function(resolve, reject) {
            const allowMode = (rule.mode == "allow");
            const authorIsOnList: boolean = (rule.authors.indexOf(post.author) !== -1);
            if (allowMode) {
                if (authorIsOnList) resolve(true);
                else throw new Error("Author of the post is not on the allow list.");
            }
            else {
                if (authorIsOnList) throw new Error("Author of the post is on the deny list.");
                else resolve(true);
            }
        });
    }
}