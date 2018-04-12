"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const steem_smartvotes_1 = require("./steem-smartvotes");
const validOp = {
    type: "smartvote",
    command: {
        name: "set_rules",
        rulesets: []
    }
};
const op = Object.assign({ type: "someInvalidType" }, validOp);
console.log(steem_smartvotes_1.default.validateJSON(JSON.stringify(op)));
//# sourceMappingURL=run.js.map