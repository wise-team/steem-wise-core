import { Ruleset } from "./Ruleset";

export interface SetRules {
    rulesets: Ruleset [];
}

export namespace SetRules {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isSetRules(o: object): o is SetRules {
        return (<SetRules>o).rulesets !== undefined
        && (<SetRules>o).rulesets !== undefined
        && Array.isArray((<SetRules>o).rulesets)
        && (<SetRules>o).rulesets.filter(ruleset => !Ruleset.isRuleset(ruleset)).length === 0;
    }
}