/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";

import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";

/**
 * This rule limits maximal or minimal weight of single vote.
 * Negative values means flag, while positive means upvote.
 */
export class WeightRule extends Rule {
    public rule: string = Rule.Type.Weight;
    public min: number;
    public max: number;

    public constructor(min: number, max: number) {
        super();

        this.min = min;
        this.max = max;
    }

    public type(): Rule.Type {
        return Rule.Type.Weight;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return BluebirdPromise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => {
            if (voteorder.weight < this.min) throw new ValidationException("Weight is too low (" + voteorder.weight + " < " + this.min + ")");
            else if (voteorder.weight > this.max) throw new ValidationException("Weight is too high (" + voteorder.weight + " > " + this.max + ")");
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["min", "max"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("WeightRule: property " + prop + " is missing");
        });
        if (Math.abs(unprototypedObj.min) > 10000)
            throw new ValidationException("WeightRule: absolute value of .min ( " + unprototypedObj.min + " ) is > 10000");
        if (Math.abs(unprototypedObj.max) > 10000)
            throw new ValidationException("WeightRule: absolute value of .max ( " + unprototypedObj.max + " ) is > 10000");
    }

    public getDescription(): string {
        return (this.min < 0 ? "Flag: "
            + Math.abs(Math.min(0, this.max)) / 100 + " - " + Math.abs(this.min) / 100 + " %"
            : "(no flag)")

            + "; " + // separator

            (this.max > 0 ? "Upvote: "
            + Math.max(0, this.min) / 100 + " - " +  this.max / 100 + " %"
            : "(no upvote)");
    }
}
