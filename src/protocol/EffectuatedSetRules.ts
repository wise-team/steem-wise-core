import { SteemOperationNumber } from "steem-efficient-stream";
import { SetRulesForVoter } from "./SetRulesForVoter";

export interface EffectuatedSetRules extends SetRulesForVoter {
    delegator: string; // pre-sent rulesets can have a voter, but delegator is a property that can be told with
    // full certanity only when the rulesets are retreived from blockchain
    moment: SteemOperationNumber;
}

export namespace EffectuatedSetRules {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isEffectuatedSetRules(o: object): o is EffectuatedSetRules {
        return SetRulesForVoter.isSetRulesForVoter(o) && (<EffectuatedSetRules>o).moment !== undefined;
    }
}
