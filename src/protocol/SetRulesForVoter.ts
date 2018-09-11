import { SetRules } from "./SetRules";

export interface SetRulesForVoter extends SetRules {
    voter: string;
}

export namespace SetRulesForVoter {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isSetRulesForVoter(o: object): o is SetRules {
        return SetRules.isSetRules(o)
            && (<SetRulesForVoter>o).voter !== undefined;
    }
}