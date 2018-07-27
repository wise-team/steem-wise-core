import { VotesCountRule } from "../../../../rules/VotesCountRule";
import { ValidationException } from "../../../../validation/ValidationException";

/* tslint:disable class-name */

export interface wise_rule_votes_count {
    rule: "votes_count";

    mode: "equal" | "more_than" | "less_than";

    value: number;
}


export function wise_rule_votes_count_encode(r: VotesCountRule): wise_rule_votes_count {
    let mode: "equal" | "more_than" | "less_than";
    if ((r as VotesCountRule).mode === VotesCountRule.Mode.EQUAL) mode = "equal";
    else if ((r as VotesCountRule).mode === VotesCountRule.Mode.MORE_THAN) mode = "more_than";
    else if ((r as VotesCountRule).mode === VotesCountRule.Mode.EQUAL) mode = "less_than";
    else throw new ValidationException("VotesCountRule: Unknown mode in votes count rule");

    const out: wise_rule_votes_count = {
        rule: "votes_count",
        mode: mode,
        value: r.value
    };
    return out;
}

export function wise_rule_votes_count_decode(r: wise_rule_votes_count): VotesCountRule  {
    let mode: VotesCountRule.Mode;
    if (r.mode === "equal") mode = VotesCountRule.Mode.EQUAL;
    else if (r.mode === "more_than") mode = VotesCountRule.Mode.MORE_THAN;
    else if (r.mode === "less_than") mode = VotesCountRule.Mode.LESS_THAN;
    else throw new ValidationException("v2:wise_rule_votes_count: unknown mode " + r.mode);

    return new VotesCountRule(mode, r.value);
}
