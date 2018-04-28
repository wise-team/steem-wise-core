import * as schema from "../schema/smartvotes.schema";
import ajv from "ajv";
import * as schemaJSON from "../../smartvotes.schema.json";

/**
 * The JSONValidator validates smartvotes operation JSON using static method #validateJSON
 */
export class JSONValidator {
    public static validateJSON(input: string): boolean {
        const aajv: ajv.Ajv = new ajv();
        aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

        const validate = aajv.compile(schemaJSON);
        return validate(JSON.parse(input)) as boolean;
    }
}