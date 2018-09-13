import { Rule } from "../rules/Rule";

export interface Ruleset {
    name: string;
    rules: Rule [];
}

export namespace Ruleset {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isRuleset(o: object): o is Ruleset {
        return (<Ruleset>o).name !== undefined
            && (<Ruleset>o).rules !== undefined
            && Array.isArray((<Ruleset>o).rules)
            && (<Ruleset>o).rules.filter(rule => !Rule.isRule(rule)).length === 0;
    }

    export function validateRuleset(o: object): o is Ruleset {
        return isRuleset(o)
            && (<Ruleset>o).name.length > 0;
    }
}