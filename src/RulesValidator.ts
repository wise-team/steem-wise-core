import * as schema from "./schema/smartvotes.schema";
import * as ajv from "ajv";
import * as schemaJSON from "../smartvotes.schema.json";
import { smartvotes_ruleset } from "./schema/rules.schema";
import * as filter from "./blockchain-filter";
import { smartvotes_operation, smartvotes_command_set_rules } from "./schema/smartvotes.schema";

/**
 * The RulesValidator validates vote orders against delegator's rulesets
 */
export class RulesValidator {
    public static getRulesOfUser(username: string, callback: (error: Error | undefined, result: smartvotes_ruleset []) => void): void {
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

    public static validateVoteOrder(voteorder: schema.smartvotes_voteorder): boolean {

        return false;
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