import * as schema from "../schema/transaction.schema";
export declare class SteemSmartvotes {
    private username;
    private postingWif;
    constructor(username: string, postingWif: string);
    sendVote(vote: schema.smartvotes_vote): void;
    sendRules(rulesets: schema.smartvotes_ruleset[]): void;
    getRules(): schema.smartvotes_ruleset[];
}
export default SteemSmartvotes;
