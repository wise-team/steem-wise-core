import * as schema from "../schema/smartvotes.schema";
import * as ajv from "ajv";
const steem = require("steem");

const schemaJSON = require("../schema/smartvotes.schema.json");

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

    public sendVoteOrder(voteorder: schema.smartvotes_voteorder, callback: (error: Error, result: any) => void): void {
        const smartvotesOp: schema.smartvotes_operation = {
            type: "smartvote",
            command: {
                name: "send_voteorders",
                voteorders: [
                    voteorder
                ]
            }
        };

        const jsonStr = JSON.stringify(smartvotesOp);

        const steemBlockchainOp = ["custom_json", {
            required_auths: [],
            required_posting_auths: [this.username],
            id: "smartvote",
            json: jsonStr
        }];

        const steemCallback = function(err: Error, result: any): void {
            callback(err, result);
            console.log(result);
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
export * from "../schema/smartvotes.schema";