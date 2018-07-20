import { WeightRule } from "../../../../rules/WeightRule";

/* tslint:disable class-name */

export interface wise_rule_weight {
    rule: "weight";

    /* This is legacy. It is no longer required. */
    mode?: string;

    /**
     * Minimal flag weight (-10000 = full flag, 0 = disable flag)
     *
     * @minimum -10000
     * @maximum 0
     * @TJS-type integer
     */
    min: number;

    /**
     * Maximal upvote weight (0 = disable upvote, 10000 = full upvote)
     *
     * @minimum 0
     * @maximum 10000
     * @TJS-type integer
     */
    max: number;
}


export function wise_rule_weight_encode(rule: WeightRule): wise_rule_weight {
    const out: wise_rule_weight = {
        rule: "weight",
        min: rule.min,
        max: rule.max
    };
    return out;
}

export function wise_rule_weight_decode(r: wise_rule_weight): WeightRule  {
    return new WeightRule(r.min, r.max);
}
