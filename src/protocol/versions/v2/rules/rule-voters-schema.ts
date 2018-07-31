/* tslint:disable class-name */

import { VotersRule } from "../../../../rules/VotersRule";
import { ValidationException } from "../../../../validation/ValidationException";

// TODO document
export interface wise_rule_voters {
    rule: "voters";
    mode: wise_rule_voters_mode;
    usernames: string [];
}
export type wise_rule_voters_mode = "all" | "any" | "one" | "none";
// "one of" mode (every post voter must be within this list)
// "none of" aka blacklist mode (none of post voters can be on this list)
// the post should have all of the specified voters
// the post should have at least one of the specified voters

export function wise_rule_voters_encode(r: VotersRule): wise_rule_voters {
    let mode: wise_rule_voters_mode;
    if (r.mode === VotersRule.Mode.ALL) mode = "all";
    else if (r.mode === VotersRule.Mode.ANY) mode = "any";
    else if (r.mode === VotersRule.Mode.ONE) mode = "one";
    else if (r.mode === VotersRule.Mode.NONE) mode = "none";
    else throw new ValidationException("VotersRule: unknown mode " + r.mode);

    const out: wise_rule_voters = {
        rule: "voters",
        mode: mode,
        usernames: r.usernames
    };
    return out;
}

export function wise_rule_voters_decode(r: wise_rule_voters): VotersRule  {
    let mode: VotersRule.Mode;
    if (r.mode === "all") mode = VotersRule.Mode.ALL;
    else if (r.mode === "any") mode = VotersRule.Mode.ANY;
    else if (r.mode === "one") mode = VotersRule.Mode.ONE;
    else if (r.mode === "none") mode = VotersRule.Mode.NONE;
    else throw new ValidationException("v2:wise_rule_voters: unknown mode " + r.mode);

    return new VotersRule(mode, r.usernames);
}
