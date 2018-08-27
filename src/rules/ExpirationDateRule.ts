import * as _ from "lodash";
import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { Promise } from "bluebird";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { ConfirmVote, isConfirmVote, isConfirmVoteBoundWithVote } from "../protocol/ConfirmVote";
import { SteemPost } from "../blockchain/SteemPost";

/**
 * This rule limits age of the post.
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

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return Promise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => context.getPost())
        .then((post: SteemPost) => {
            const ruleDateParsed = new Date(Date.parse(this.date));
            const nowDate = new Date(Date.now());

            if (nowDate.getTime() > ruleDateParsed.getTime()) throw new ValidationException(
                "ExpirationDateRule: This rule has expired (expiration datetime was " + ruleDateParsed.toISOString()
                 + ", now is " + nowDate.toISOString() + ")."
            );
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["date"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("ExpirationDateRule: property " + prop + " is missing");
        });

        if (!Date.parse(unprototypedObj.date)) throw new ValidationException("ExpirationDateRule: date should be "
            + "formatted in one of the following formats: ISO 8601, IETF");
    }
}
