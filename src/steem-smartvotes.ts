import * as schema from "./schema/smartvotes.schema";
import * as ajv from "ajv";
import * as schemaJSON from "../smartvotes.schema.json";

const steem = require("steem");

export class SteemSmartvotes {
    private username: string;
    private postingWif: string;

    constructor(username: string, postingWif: string) {
        this.username = username;
        this.postingWif = postingWif;

        if (username.length == 0 || postingWif.length == 0) throw new Error("Credentials cannot be empty");
    }

    public validateVoteOrder(voteorder: schema.smartvotes_voteorder): boolean {
        console.error("Vote validation is not yet supported. It is now returning true in every case.");
        return true;
    }

    // TODO send vote + voteorder
    public sendVoteOrder(voteorder: schema.smartvotes_voteorder, callback: (error: Error, result: any) => void): void {
        const smartvotesOp: schema.smartvotes_operation = {
            name: "send_voteorders",
            voteorder: voteorder
        };

        const jsonStr = JSON.stringify(smartvotesOp);

        if (!SteemSmartvotes.validateJSON(jsonStr)) throw new Error("Vote order command JSON is invalid");

        const steemBlockchainOp = ["custom_json", {
            required_auths: [],
            required_posting_auths: [this.username],
            id: "smartvote",
            json: jsonStr
        }];

        const steemCallback = function(err: Error, result: any): void {
            callback(err, result);
        };

        steem.broadcast.send(
            {
                extensions: [],
                operations: [steemBlockchainOp],
            },
            {posting: this.postingWif},
            steemCallback
        );
    }

    public sendRules(rulesets: schema.smartvotes_ruleset []): void {
        throw new Error("Not implemented yet");
    }

    public getRules(): schema.smartvotes_ruleset [] {
        throw new Error("Not implemented yet");
    }

    public loadSmartvotesOperationsOfAccount(username: string, callback: (error: Error, result: schema.smartvotes_operation []) => void): void {
        throw new Error("Not implemented yet");
    }

    public static validateJSON(input: string) {
        const aajv: ajv.Ajv = new ajv();
        aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));

        const validate = aajv.compile(schemaJSON);
        return validate(JSON.parse(input));
    }
}

export default SteemSmartvotes;
export * from "./schema/smartvotes.schema";