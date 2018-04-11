#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SteemSmartvotes {
    constructor(username, postingWif) {
        this.username = username;
        this.postingWif = postingWif;
    }
    sendVote(vote) {
        return;
    }
    sendRules(rulesets) {
        return;
    }
    getRules() {
        return [];
    }
}
exports.SteemSmartvotes = SteemSmartvotes;
exports.default = SteemSmartvotes;
//# sourceMappingURL=steem-smartvotes.js.map