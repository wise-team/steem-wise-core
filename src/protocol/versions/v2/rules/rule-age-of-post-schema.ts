/* tslint:disable class-name */

import { AgeOfPostRule } from "../../../../rules/AgeOfPostRule";
import { ValidationException } from "../../../../validation/ValidationException";

// TODO document
export interface wise_rule_age_of_post {
    rule: "age_of_post";
    mode: wise_rule_age_of_post_mode;
    unit: "day" | "hour" | "minute" | "second";
    value: number;
}
export type wise_rule_age_of_post_mode = "older_than" | "younger_than";

export function wise_rule_age_of_post_encode(r: AgeOfPostRule): wise_rule_age_of_post {
    let mode: wise_rule_age_of_post_mode;
    if ((r as AgeOfPostRule).mode === AgeOfPostRule.Mode.OlderThan) mode = "older_than";
    else if ((r as AgeOfPostRule).mode === AgeOfPostRule.Mode.YoungerThan) mode = "younger_than";
    else throw new ValidationException("Unknown mode of age of post rule");

    let unit: "day" | "hour" | "minute" | "second";
    if ((r as AgeOfPostRule).mode === AgeOfPostRule.TimeUnit.DAY) unit = "day";
    else if ((r as AgeOfPostRule).mode === AgeOfPostRule.TimeUnit.HOUR) unit = "hour";
    else if ((r as AgeOfPostRule).mode === AgeOfPostRule.TimeUnit.MINUTE) unit = "minute";
    else if ((r as AgeOfPostRule).mode === AgeOfPostRule.TimeUnit.SECOND) unit = "second";
    else throw new ValidationException("Unknown unit in age of post rule");

    const out: wise_rule_age_of_post = {
        rule: "age_of_post",
        mode: mode,
        unit: unit,
        value: (r as AgeOfPostRule).value
    };
    return out;
}

export function wise_rule_age_of_post_decode(r: wise_rule_age_of_post): AgeOfPostRule  {
    let mode: AgeOfPostRule.Mode;
    if (r.mode === "older_than") mode = AgeOfPostRule.Mode.OLDER_THAN;
    else if (r.mode === "younger_than") mode = AgeOfPostRule.Mode.YOUNGER_THAN;
    else throw new ValidationException("v2:wise_rule_age_of_post: unknown mode " + r.mode);

    let unit: AgeOfPostRule.TimeUnit;
    if (r.unit === "day") unit = AgeOfPostRule.TimeUnit.DAY;
    else if (r.unit === "hour") unit = AgeOfPostRule.TimeUnit.HOUR;
    else if (r.unit === "minute") unit = AgeOfPostRule.TimeUnit.MINUTE;
    else if (r.unit === "second") unit = AgeOfPostRule.TimeUnit.SECOND;
    else throw new ValidationException("v2:wise_rule_age_of_post: unknown unit " + r.unit);


    return new AgeOfPostRule(mode, unit, r.value);
}
