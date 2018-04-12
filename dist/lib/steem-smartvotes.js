#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ajv = require("ajv");
const schemaJSON = require("../schema/smartvotes.schema.json");
class SteemSmartvotes {
    constructor(username, postingWif) {
        this.username = username;
        this.postingWif = postingWif;
    }
    sendVote(vote) {
        throw new Error("Not yet supported");
    }
    sendRules(rulesets) {
        throw new Error("Not yet supported");
    }
    getRules() {
        throw new Error("Not yet supported");
    }
    static validateJSON(input) {
        const aajv = new ajv();
        aajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
        const validate = aajv.compile(schemaJSON);
        return validate(JSON.parse(input));
    }
}
exports.SteemSmartvotes = SteemSmartvotes;
exports.default = SteemSmartvotes;
//# sourceMappingURL=steem-smartvotes.js.map