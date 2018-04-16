import * as schema from "../schema/operation.schema";
import * as ajv from "ajv";

const schemaJSON = require("../schema/smartvotes.schema.json");

export class SteemSmartvotes {
    private username: string;
    private postingWif: string;

    constructor(username: string, postingWif: string) {
        this.username = username;
        this.postingWif = postingWif;

        if (username.length == 0 || postingWif.length == 0) throw new Error("Credentials cannot be empty");
    }

    public validateVote(vote: schema.smartvotes_vote): boolean {
        console.error("Vote validation is not yet supported. It is now returning true in every case.");
        return true;
    }

    public sendVote(vote: schema.smartvotes_vote, callback: (error: Error) => void): void {
        throw new Error("Not yet supported");
    }

    public sendRules(rulesets: schema.smartvotes_ruleset []): void {
        throw new Error("Not yet supported");
    }

    public getRules(): schema.smartvotes_ruleset [] {
        throw new Error("Not yet supported");
    }

    public static validateJSON(input: string) {
        const aajv: ajv.Ajv = new ajv();
        aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

        const validate = aajv.compile(schemaJSON);
        return validate(JSON.parse(input));
    }
}

export default SteemSmartvotes;