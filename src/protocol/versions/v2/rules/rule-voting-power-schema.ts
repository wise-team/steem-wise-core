/* tslint:disable class-name */

import { ValidationException } from "../../../../validation/ValidationException";
import { VotingPowerRule } from "../../../../rules/VotingPowerRule";

/**
 * This rule checks vorting_power of the delegator. Available modes are: more_than, less_than and egual.
 */
export interface wise_rule_voting_power {
    rule: "voting_power";
    mode: wise_rule_voting_power_mode;

    /**
     * Voting power of the delegator in steem_percent. 100% = 10'000 and 0% = 0. Percentage is multiplied by 100.
     */
    value: number;
}
export type wise_rule_voting_power_mode = "more_than" | "less_than" | "equal";

export function wise_rule_voting_power_encode(r: VotingPowerRule): wise_rule_voting_power {
    let mode: wise_rule_voting_power_mode;
    if ((r as VotingPowerRule).mode === VotingPowerRule.Mode.MORE_THAN) mode = "more_than";
    else if ((r as VotingPowerRule).mode === VotingPowerRule.Mode.LESS_THAN) mode = "less_than";
    else if ((r as VotingPowerRule).mode === VotingPowerRule.Mode.EQUAL) mode = "equal";
    else throw new ValidationException("Unknown mode of voting power rule");

    const out: wise_rule_voting_power = {
        rule: "voting_power",
        mode: mode,
        value: (r as VotingPowerRule).value
    };
    return out;
}

export function wise_rule_voting_power_decode(r: wise_rule_voting_power): VotingPowerRule  {
    let mode: VotingPowerRule.Mode;
    if (r.mode === "more_than") mode = VotingPowerRule.Mode.MORE_THAN;
    else if (r.mode === "less_than") mode = VotingPowerRule.Mode.LESS_THAN;
    else if (r.mode === "equal") mode = VotingPowerRule.Mode.EQUAL;
    else throw new ValidationException("v2:wise_rule_voting_power: unknown mode " + r.mode);

    return new VotingPowerRule(mode, r.value);
}
