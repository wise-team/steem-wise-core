#!/usr/bin/env node

import * as schema from "../schema/operation.schema";

export class SteemSmartvotes {
    private username: string;
    private postingWif: string;

    constructor(username: string, postingWif: string) {
        this.username = username;
        this.postingWif = postingWif;
    }

    public sendVote(vote: schema.smartvotes_vote): void {
        return;
    }

    public sendRules(rulesets: schema.smartvotes_ruleset []): void {
        return;
    }

    public getRules(): schema.smartvotes_ruleset [] {
        return [];
    }
}

export default SteemSmartvotes;