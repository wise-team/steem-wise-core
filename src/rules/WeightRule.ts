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

    public async validate (voteorder: SendVoteorder, context: ValidationContext) {
        this.validateRuleObject(this);

        if (voteorder.weight < this.min) throw new ValidationException(
            "Weight of vote (" + this.weightToPercent(voteorder.weight) + ") is lower than  " + this.weightToPercent(this.min)
        );
        else if (voteorder.weight > this.max) throw new ValidationException(
            "Weight of vote (" + this.weightToPercent(voteorder.weight) + ") is higher than (" + this.weightToPercent(this.max)
        );
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
        return (this.min < 0 ? "Can flag: "
            + Math.abs(Math.min(0, this.max)) / 100 + " - " + Math.abs(this.min) / 100 + " %"
            : "(cannot flag)")

            + "; " + // separator

            (this.max > 0 ? "Can upvote: "
            + Math.max(0, this.min) / 100 + " - " +  this.max / 100 + " %"
            : "(cannot upvote)");
    }

    private weightToPercent(weight: number): string {
        return (weight / 100).toFixed(2) + "%";
    }
}
