import * as schema from "./schema/smartvotes.schema";
import * as ajv from "ajv";
import * as schemaJSON from "../smartvotes.schema.json";

export class Validator {
    public static validateVoteOrderAgainstRules(voteorder: schema.smartvotes_voteorder): boolean {
        return false;
    }

    public static validateJSON(input: string): boolean {
        const aajv: ajv.Ajv = new ajv();
        aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

        const validate = aajv.compile(schemaJSON);
        return validate(JSON.parse(input)) as boolean;
    }
}