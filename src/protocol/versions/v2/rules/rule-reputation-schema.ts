/* tslint:disable class-name */

import { ReputationRule } from "../../../../rules/ReputationRule";

// TODO document
export interface wise_rule_reputation {
    rule: "reputation";

    /**
     * Minimal reputation
     *
     * @minimum TODO
     * @maximum TODO
     * @TJS-type integer? TODO
     */
    min: number;

    /**
     * Maximal reputation
     *
     * @minimum TODO
     * @maximum TODO
     * @TJS-type integer? TODO
     */
    max: number;
}


export function wise_rule_reputation_encode(rule: ReputationRule): wise_rule_reputation {
    const out: wise_rule_reputation = {
        rule: "reputation",
        min: rule.min,
        max: rule.max
    };
    return out;
}

export function wise_rule_reputation_decode(r: wise_rule_reputation): ReputationRule  {
    return new ReputationRule(r.min, r.max);
}
