import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { SetRulesForVoter } from "./SetRulesForVoter";

export interface EffectuatedSetRules extends SetRulesForVoter {
    moment: SteemOperationNumber;
}

export namespace EffectuatedSetRules {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isEffectuatedSetRules(o: object): o is EffectuatedSetRules {
        return SetRulesForVoter.isSetRulesForVoter(o)
            && (<EffectuatedSetRules>o).moment !== undefined;
    }
}