import { FirstPostRule } from "../../../../rules/FirstPostRule";
import { ValidationException } from "../../../../validation/ValidationException";

/* tslint:disable class-name */

export interface wise_rule_first_post {
    rule: "first_post";
}


export function wise_rule_first_post_encode(r: FirstPostRule): wise_rule_first_post {
    const out: wise_rule_first_post = {
        rule: "first_post",
    };
    return out;
}

export function wise_rule_first_post_decode(r: wise_rule_first_post): FirstPostRule  {
    return new FirstPostRule();
}
