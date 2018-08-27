/* tslint:disable class-name */

import { ExpirationDateRule } from "../../../../rules/ExpirationDateRule";
import { ValidationException } from "../../../../validation/ValidationException";

// TODO document
export interface wise_rule_expiration_date {
    rule: "expiration_date";

    /**
     * An ISO 8601 date, at which validation of this rule will begin to fail.
     * Remember to specify the time zone. If not specified default is the UTC/GMT timezone (+0:00).
     */
    date: string;
}

export function wise_rule_expiration_date_encode(r: ExpirationDateRule): wise_rule_expiration_date {
    if (!Date.parse(r.date)) throw new ValidationException("ExpirationDateRule: date should be "
            + "formatted in one of the following formats: ISO 8601, IETF");

    const out: wise_rule_expiration_date = {
        rule: "expiration_date",
        date: r.date
    };
    return out;
}

export function wise_rule_expiration_date_decode(r: wise_rule_expiration_date): ExpirationDateRule  {
    if (!Date.parse(r.date)) throw new ValidationException("ExpirationDateRule: date should be "
            + "formatted in one of the following formats: ISO 8601, IETF");

    return new ExpirationDateRule(r.date);
}
