/* tslint:disable class-name */

import { WeightForPeriodRule } from "../../../../rules/WeightForPeriodRule";


/**
 * This rule limits total absolute weight)of confirmed voteorders over given period of time.
 * It sums up absolute weights of upvotes and flags.
 */
export interface wise_rule_weight_for_period {
    rule: "weight_for_period";

    /**
     * The unit of period. It can be either: day, hour, minute, second
     */
    unit: "day" | "hour" | "minute" | "second";

    /**
     * The value of period.
     *
     * @TJS-type integer
     */
    period: number;

    /**
     * Maximum total weight over given period of time. It is expressed in steem percent unit.
     * It means that 1 full (100%) upvote/flag is 10'000 while 2 full upvotes/flags is 20'000.
     *
     * @TJS-type integer
     */
    weight: number;
}


export function wise_rule_weight_for_period_encode(rule: WeightForPeriodRule): wise_rule_weight_for_period {
    const out: wise_rule_weight_for_period = {
        rule: "weight_for_period",
        unit: rule.unit,
        period: rule.period,
        weight: rule.weight
    };
    return out;
}

export function wise_rule_weight_for_period_decode(r: wise_rule_weight_for_period): WeightForPeriodRule  {
    return new TotaWeightRule();
}
