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
 * This rule limits age of the post.
 */
export class AgeOfPostRule extends Rule {
    public rule: string = Rule.Type.AgeOfPost;
    public mode: AgeOfPostRule.Mode;
    public unit: AgeOfPostRule.TimeUnit;
    public value: number;

    public constructor(mode: AgeOfPostRule.Mode, value: number, unit: AgeOfPostRule.TimeUnit) {
        super();

        this.mode = mode;
        this.value = value;
        this.unit = unit;
    }

    public type(): Rule.Type {
        return Rule.Type.AgeOfPost;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return BluebirdPromise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => context.getPost())
        .then((post: SteemPost) => {
            const unitMultiplier = (this.unit === AgeOfPostRule.TimeUnit.DAY ? 24 * 60 * 60 :
                                   (this.unit === AgeOfPostRule.TimeUnit.HOUR ? 60 * 60 :
                                   (this.unit === AgeOfPostRule.TimeUnit.MINUTE ? 60 :
                                1)));
            const numberOfSeconds = this.value * unitMultiplier;
            const thresholdTime = new Date(Date.now() - numberOfSeconds * 1000);

            const postTime = new Date(post.created + "Z" /* this is UTC date */);

            if (this.mode === AgeOfPostRule.Mode.OLDER_THAN) {
                if (postTime.getTime() >= thresholdTime.getTime()) throw new ValidationException(
                    "AgeOfPostRule: Post (" + postTime + ") is older than " + thresholdTime
                );
            }
            else if (this.mode === AgeOfPostRule.Mode.YOUNGER_THAN) {
                if (postTime.getTime() <= thresholdTime.getTime()) throw new ValidationException(
                    "AgeOfPostRule: Post (" + postTime + ") is younger than " + thresholdTime
                );
            }
            else throw new ValidationException("AgeOfPostRule: Unknown mode " + this.mode);
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["mode", "value", "unit"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("AgeOfPostRule: property " + prop + " is missing");
        });

        if (!_.includes([
            AgeOfPostRule.TimeUnit.DAY, AgeOfPostRule.TimeUnit.HOUR,
            AgeOfPostRule.TimeUnit.MINUTE, AgeOfPostRule.TimeUnit.SECOND
        ], unprototypedObj.unit))
            throw new ValidationException("AgeOfPostRule: unknown unit " + unprototypedObj.unit);

        if (!_.includes([
            AgeOfPostRule.Mode.OLDER_THAN, AgeOfPostRule.Mode.YOUNGER_THAN,
        ], unprototypedObj.mode))
            throw new ValidationException("AgeOfPostRule: unknown mode " + unprototypedObj.mode);
    }
}

export namespace AgeOfPostRule {
    export enum TimeUnit {
        DAY = "day",
        HOUR = "hour",
        MINUTE = "minute",
        SECOND = "second"
    }

    export enum Mode {
        OLDER_THAN = "older_than",
        YOUNGER_THAN = "younger_than"
    }
}
