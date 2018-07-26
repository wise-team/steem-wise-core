import { Promise } from "bluebird";
import * as _ from "lodash";

import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { NotFoundException } from "../util/NotFoundException";
import { AccountInfo } from "../blockchain/AccountInfo";
import { SteemPost } from "../blockchain/SteemPost";

export class VotesCountRule extends Rule {
    public rule: string = Rule.Type.VotesCount;
    public value: number;
    public mode: VotesCountRule.Mode;

    public constructor(mode: VotesCountRule.Mode, value: number) {
        super();

        this.mode = mode;
        this.value = value;
    }

    public type(): Rule.Type {
        return Rule.Type.VotesCount;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return Promise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => context.getPost())
        .then((post: SteemPost) => {
            const voteCount = post.active_votes.length;

            if (this.mode == VotesCountRule.Mode.EQUAL) {
                if (voteCount !== this.value)
                    throw new ValidationException("Delegator voting power (" + voteCount + ") does not equal " + this.value);
            }
            else if (this.mode == VotesCountRule.Mode.MORE_THAN) {
                if (voteCount<= this.value)
                throw new ValidationException("Delegator voting power (" + voteCount + ") is not more than " + this.value);
            }
            else if (this.mode == VotesCountRule.Mode.LESS_THAN) {
                if (voteCount >= this.value)
                throw new ValidationException("Delegator voting power (" + voteCount + ") is not less than " + this.value);
            }
            else {
                throw new Error("Unknown mode of votes count rule: " + this.mode);
            }
        })
        .catch((e: Error) => {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["value", "mode"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("VotesCountRule: property " + prop + " is missing");
        });
        if (!_.includes([VotesCountRule.Mode.MORE_THAN, VotesCountRule.Mode.LESS_THAN, VotesCountRule.Mode.EQUAL], unprototypedObj.mode))
            throw new ValidationException("VotesCountRule: unknown mode " + unprototypedObj.mode);
    }
}

export namespace VotesCountRule {
    export enum Mode {
        MORE_THAN = "more_than",
        LESS_THAN = "less_than",
        EQUAL = "equal"
    }
}