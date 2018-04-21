import * as schema from "./schema/smartvotes.schema";
import * as ajv from "ajv";
import * as schemaJSON from "../smartvotes.schema.json";
import { smartvotes_ruleset } from "./schema/rules.schema";
import * as filter from "./blockchain-filter";
import { smartvotes_operation, smartvotes_command_set_rules } from "./schema/smartvotes.schema";
import { JSONValidator } from "./JSONValidator";

/**
 * The RulesValidator validates vote orders against delegator's rulesets
 */
export class RulesValidator {
    public static getRulesOfUser(username: string, callback: (error: Error | undefined, result: smartvotes_ruleset []) => void): void {
        if (typeof username === "undefined" || username.length == 0) { callback(new Error("Username must not be empty"), []); return; }

        filter.getOperations(username, ["set_rules"], 1, function(error: Error, result: smartvotes_operation []): void {
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

    // TODO validation at exact time
    public static validateVoteOrder(voteorder: schema.smartvotes_voteorder, gmtTimestamp: number, callback: (error: Error | undefined, result: boolean) => void): void {
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

        RulesValidator.getRulesOfUser(voteorder.delegator, function (error: Error | undefined, rulesets: smartvotes_ruleset []) {
            for (const i in rulesets) {

            }
            callback(new Error("Delegator had no such ruleset"), false); return;
        });
    }

    public static validateJSON(input: string): boolean {
        const aajv: ajv.Ajv = new ajv();
        aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

        const validate = aajv.compile(schemaJSON);
        return validate(JSON.parse(input)) as boolean;
    }
}

abstract class RuleValidator {
    public abstract validate(voteorder: schema.smartvotes_voteorder): boolean;
}

class AuthorsRuleValidator extends RuleValidator {
    public validate(voteorder: schema.smartvotes_voteorder): boolean {
        throw new Error("Not implemented yet");
    }
}

class TagsRuleValidator extends RuleValidator {
    public validate(voteorder: schema.smartvotes_voteorder): boolean {
        throw new Error("Not implemented yet");
    }
}

class CustomRPCRuleValidator extends RuleValidator {
    public validate(voteorder: schema.smartvotes_voteorder): boolean {
        throw new Error("Not implemented yet");
    }
}