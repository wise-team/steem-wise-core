/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";

import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { SteemPost } from "../blockchain/SteemPost";

/**
 * This rule expires the ruleset.
 */
export class ExpirationDateRule extends Rule {
    public rule: string = Rule.Type.ExpirationDate;
    public date: string; // a string should be saved to preserve specified timezone.

    public constructor(date: string) {
        super();

        this.date = date;
    }

    public type(): Rule.Type {
        return Rule.Type.ExpirationDate;
    }

    public async validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        this.validateRuleObject(this);
        const post = await context.getPost();

        const ruleDateParsed = new Date(Date.parse(this.date));
        const nowDate = new Date(Date.now());

        if (nowDate.getTime() > ruleDateParsed.getTime()) throw new ValidationException(
            "ExpirationDateRule: This rule has expired (expiration datetime was " + ruleDateParsed.toISOString()
                + ", now is " + nowDate.toISOString() + ")."
        );
    }

    public validateRuleObject(unprototypedObj: any) {
        ["date"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("ExpirationDateRule: property " + prop + " is missing");
        });

        if (!Date.parse(unprototypedObj.date)) throw new ValidationException("ExpirationDateRule: date should be "
            + "formatted in one of the following formats: ISO 8601, IETF");
    }

    public getDescription(): string {
        return "Ruleset expires at " + this.date;
    }
}
