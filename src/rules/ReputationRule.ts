import * as _ from "lodash";
import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { Promise } from "bluebird";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { AccountInfo } from "../blockchain/AccountInfo";

/**
 * This rule limits maximal or minimal weight of single vote.
 * Negative values means flag, while positive means upvote.
 */
export class ReputationRule extends Rule {
    public rule: string = Rule.Type.Reputation;
    public min: number;
    public max: number;

    public constructor(min: number, max: number) {
        super();

        this.min = min;
        this.max = max;
    }

    public type(): Rule.Type {
        return Rule.Type.Reputation;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return Promise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => context.getAccountInfo(voteorder.author))
        .then((authorInfo: AccountInfo) => {
            const reputation = authorInfo.reputation;
            if (voteorder.weight < this.min) throw new ValidationException("Reputation is too low (" + voteorder.weight + " < " + this.min + ")");
            else if (voteorder.weight > this.max) throw new ValidationException("Reputation is too high (" + voteorder.weight + " > " + this.max + ")");
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["min", "max"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("ReputationRule: property " + prop + " is missing");
        });
        if (Math.abs(unprototypedObj.min) > 10000)
            throw new ValidationException("ReputationRule: absolute value of .min ( " + unprototypedObj.min + " ) is > 10000");
        if (Math.abs(unprototypedObj.max) > 10000)
            throw new ValidationException("ReputationRule: absolute value of .max ( " + unprototypedObj.max + " ) is > 10000");
    }

    // TODO unit test (26714311062 should produce 37, negative produces -1)
    public _calculateReputationScore(rawReputation: number) {
        if (rawReputation < -1) {
            
        }
        const step1 = Math.log(rawReputation) / Math.LN10;
        const step2 = (step1 - 9) * 9 + 25;
        return Math.floor(step2);
    }
}
