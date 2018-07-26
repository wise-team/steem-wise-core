import { PayoutRule } from "../../../../rules/PayoutRule";
import { ValidationException } from "../../../../validation/ValidationException";

/* tslint:disable class-name */

export interface wise_rule_payout {
    rule: "payout";

    mode: "equal" | "more_than" | "less_than";

    value: number;
}


export function wise_rule_payout_encode(r: PayoutRule): wise_rule_payout {
    let mode: "equal" | "more_than" | "less_than";
    if ((r as PayoutRule).mode === PayoutRule.Mode.EQUAL) mode = "equal";
    else if ((r as PayoutRule).mode === PayoutRule.Mode.MORE_THAN) mode = "more_than";
    else if ((r as PayoutRule).mode === PayoutRule.Mode.EQUAL) mode = "less_than";
    else throw new ValidationException("PayoutRule: Unknown mode in votes count rule");

    const out: wise_rule_payout = {
        rule: "payout",
        mode: mode,
        value: r.value
    };
    return out;
}

export function wise_rule_payout_decode(r: wise_rule_payout): PayoutRule  {
    let mode: PayoutRule.Mode;
    if (r.mode === "equal") mode = PayoutRule.Mode.EQUAL;
    else if (r.mode === "more_than") mode = PayoutRule.Mode.MORE_THAN;
    else if (r.mode === "less_than") mode = PayoutRule.Mode.LESS_THAN;
    else throw new ValidationException("v2:wise_rule_payout: unknown mode " + r.mode);

    return new PayoutRule(r.mode, r.value);
}
