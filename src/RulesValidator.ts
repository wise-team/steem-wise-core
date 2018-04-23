import * as ajv from "ajv";
import * as schemaJSON from "../smartvotes.schema.json";
import { smartvotes_rule, smartvotes_ruleset } from "./schema/rules.schema";
import * as filter from "./blockchain-filter";
import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc } from "./schema/smartvotes.schema";
import { JSONValidator } from "./JSONValidator";
import { Promise } from "bluebird";

/**
 * The RulesValidator validates vote orders against delegator's rulesets
 */
export class RulesValidator {
    public static getRulesOfUser(username: string, beforeDate: Date, callback: (error: Error | undefined, result: smartvotes_ruleset []) => void): void {
        if (typeof username === "undefined" || username.length == 0) { callback(new Error("Username must not be empty"), []); return; }

        filter.getOperationsBeforeDate(username, ["set_rules"], 1, beforeDate, function(error: Error, result: smartvotes_operation []): void {
            if (error) {
                callback(error, []);
            }
            else if (result.length == 0) {
                callback(undefined, []);
            }
            else {
                callback(undefined, (result[0] as smartvotes_command_set_rules).rulesets);
            }
        });
    }

    // TODO fail on nonexistent post
    public static validateVoteOrder(username: string, voteorder: smartvotes_voteorder, publishDate: Date, callback: (error: Error | undefined, result: boolean) => void): void {
        if (typeof voteorder === "undefined") { callback(new Error("Voteorder must not be empty"), false); return; }
        if (typeof voteorder.delegator === "undefined" || voteorder.delegator.length == 0) { callback(new Error("Delegator must not be empty"), false); return; }
        if (typeof voteorder.ruleset_name === "undefined" || voteorder.ruleset_name.length == 0) { callback(new Error("Ruleset_name must not be empty"), false); return; }
        if (typeof voteorder.author === "undefined" || voteorder.author.length == 0) { callback(new Error("Author must not be empty"), false); return; }
        if (typeof voteorder.permlink === "undefined" || voteorder.permlink.length == 0) { callback(new Error("Permlink must not be empty"), false); return; }
        if (typeof voteorder.type === "undefined" || voteorder.type.length == 0) { callback(new Error("Type must not be empty"), false); return; }
        if (!(voteorder.type === "upvote" || voteorder.type === "flag")) { callback(new Error("Type must be: upvote or flag"), false); return; }
        if (typeof voteorder.weight === "undefined") { callback(new Error("Weight must not be empty"), false); return; }
        if (voteorder.weight <= 0) { callback(new Error("Weight must be greater than zero"), false); return; }
        if (voteorder.weight > 10000) { callback(new Error("Weight must be lesser or equal 10000"), false); return; }

        Promise.promisify(RulesValidator.getRulesOfUser)(voteorder.delegator, publishDate). then( function (rulesets: smartvotes_ruleset []): smartvotes_ruleset {
            for (const i in rulesets) {
                if (rulesets[i].name == voteorder.ruleset_name) {
                    return rulesets[i];
                }
            }
            throw new Error("Delegator had no such ruleset at " + publishDate);
        }). then( function (ruleset: smartvotes_ruleset): smartvotes_ruleset {
            if (ruleset.voter !== username) throw new Error("This ruleset do not allow " + username + " to vote.");

            if (ruleset.action !== "upvote+flag") {
                if (voteorder.type === ruleset.action) throw new Error("This ruleset do not allow " + voteorder.type + "action");
            }

            // TODO total vote weight calculator
            if (voteorder.weight > ruleset.total_weight) throw new Error("Total vote weight allowed by this ruleset was exceeded.");

            return ruleset;
        }).then(function(ruleset: smartvotes_ruleset) {
            const validationPromises: Promise<boolean> [] = [];
            for (const i in ruleset.rules) {
                switch (ruleset.rules[i].type) {
                    case "authors":
                        validationPromises.push(new AuthorsRuleValidator()
                            .validate(voteorder, ruleset.rules[i] as smartvotes_rule_authors));
                        break;

                    case "tags":
                        validationPromises.push(new TagsRuleValidator()
                            .validate(voteorder, ruleset.rules[i] as smartvotes_rule_tags));
                        break;

                    case "custom_rpc":
                        validationPromises.push(new CustomRPCRuleValidator()
                            .validate(voteorder, ruleset.rules[i] as smartvotes_rule_custom_rpc));
                        break;

                    default:
                        throw new Error("Unknown rule type: " + ruleset.rules[i].type);
                }
            }
            return Promise.all(validationPromises);
        }).then(function(values: any) {
            const validityArray: boolean [] = values as boolean [];
            for (const i in validityArray) {
                if (!validityArray[i]) throw new Error("Rule validation failed");
            }
        })
        .catch(error => callback(error, false));
    }
}

abstract class RuleValidator {
    public abstract validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule): Promise<boolean>;
}

class AuthorsRuleValidator extends RuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_authors): Promise<boolean> {
        throw new Error("Not implemented yet");
    }
}

class TagsRuleValidator extends RuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_tags): Promise<boolean> {
        throw new Error("Not implemented yet");
    }
}

class CustomRPCRuleValidator extends RuleValidator {
    public validate(voteorder: smartvotes_voteorder, rule: smartvotes_rule_custom_rpc): Promise<boolean> {
        throw new Error("Not implemented yet");
    }
}