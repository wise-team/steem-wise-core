/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";

import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { NotFoundException } from "../util/NotFoundException";
import { SteemPost } from "../blockchain/SteemPost";

export class PayoutRule extends Rule {
    public rule: string = Rule.Type.Payout;
    public value: number;
    public mode: PayoutRule.Mode;

    public constructor(mode: PayoutRule.Mode, value: number) {
        super();

        this.mode = mode;
        this.value = value;
    }

    public type(): Rule.Type {
        return Rule.Type.Payout;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return BluebirdPromise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => context.getPost())
        .then((post: SteemPost) => {
            const payout = PayoutRule._parsePayout(post.total_payout_value);

            if (this.mode == PayoutRule.Mode.EQUAL) {
                if (payout !== this.value)
                    throw new ValidationException("Payout rule: payout (" + payout + ") does not equal " + this.value);
            }
            else if (this.mode == PayoutRule.Mode.MORE_THAN) {
                if (payout <= this.value)
                throw new ValidationException("Payout rule: payout (" + payout + ") is not more than " + this.value);
            }
            else if (this.mode == PayoutRule.Mode.LESS_THAN) {
                if (payout >= this.value)
                throw new ValidationException("Payout rule: payout (" + payout + ") is not less than " + this.value);
            }
            else {
                throw new Error("Unknown mode of payout rule: " + this.mode);
            }
        })
        .catch((e: Error) => {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["value", "mode"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("PayoutRule: property " + prop + " is missing");
        });
        if (!_.includes([PayoutRule.Mode.MORE_THAN, PayoutRule.Mode.LESS_THAN, PayoutRule.Mode.EQUAL], unprototypedObj.mode))
            throw new ValidationException("PayoutRule: unknown mode " + unprototypedObj.mode);
    }

    public static _parsePayout(payoutStr: string): number {
        const regex = /^([0-9]+\.?[0-9]*) SBD$/gm;
        const matches = regex.exec(payoutStr);
        if (matches && matches.length > 1) {
            return parseFloat(matches[1]);
        }
        else throw new Error("PayoutRule: cannot parse payout (" + payoutStr + ")");
    }
}

export namespace PayoutRule {
    export enum Mode {
        MORE_THAN = "more_than",
        LESS_THAN = "less_than",
        EQUAL = "equal"
    }
}