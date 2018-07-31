/* tslint:disable class-name */

import { WeightForPeriodRule } from "../../../../rules/WeightForPeriodRule";
import { ValidationException } from "../../../../validation/ValidationException";


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
    let unit: "day" | "hour" | "minute" | "second";
    if (rule.unit === WeightForPeriodRule.PeriodUnit.DAY) unit = "day";
    else if (rule.unit === WeightForPeriodRule.PeriodUnit.HOUR) unit = "hour";
    else if (rule.unit === WeightForPeriodRule.PeriodUnit.MINUTE) unit = "minute";
    else if (rule.unit === WeightForPeriodRule.PeriodUnit.SECOND) unit = "second";
    else throw new ValidationException("WeightForPeriodRule, unknown unit: " + rule.unit);

    const out: wise_rule_weight_for_period = {
        rule: "weight_for_period",
        unit: unit,
        period: rule.period,
        weight: rule.weight
    };
    return out;
}

export function wise_rule_weight_for_period_decode(r: wise_rule_weight_for_period): WeightForPeriodRule  {
    switch (r.unit) {
        case "day":
            return new WeightForPeriodRule(r.period, WeightForPeriodRule.PeriodUnit.DAY, r.weight);
        case "hour":
            return new WeightForPeriodRule(r.period, WeightForPeriodRule.PeriodUnit.HOUR, r.weight);
        case "minute":
            return new WeightForPeriodRule(r.period, WeightForPeriodRule.PeriodUnit.MINUTE, r.weight);
        case "second":
            return new WeightForPeriodRule(r.period, WeightForPeriodRule.PeriodUnit.SECOND, r.weight);
        default:
            throw new ValidationException("V2 wise_rule_weight_for_period: Unknown period unit " + r.unit);
    }
}
