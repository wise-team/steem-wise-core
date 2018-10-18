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

    public async validate (voteorder: SendVoteorder, context: ValidationContext) {
        this.validateRuleObject(this);
        let post;
        try {
            post = await context.getPost();
        }
        catch (e) {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        }
        const voteCount = post.active_votes.length;

        if (this.mode == VotesCountRule.Mode.EQUAL) {
            if (voteCount !== this.value)
                throw new ValidationException("Post votes count (" + voteCount + ") does not equal " + this.value);
        }
        else if (this.mode == VotesCountRule.Mode.MORE_THAN) {
            if (voteCount <= this.value)
            throw new ValidationException("Post votes count (" + voteCount + ") is not more than " + this.value);
        }
        else if (this.mode == VotesCountRule.Mode.LESS_THAN) {
            if (voteCount >= this.value)
            throw new ValidationException("Post votes count (" + voteCount + ") is not less than " + this.value);
        }
        else {
            throw new Error("Unknown mode of votes count rule: " + this.mode);
        }
    }

    public validateRuleObject(unprototypedObj: any) {
        ["value", "mode"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("VotesCountRule: property " + prop + " is missing");
        });
        if (!_.includes([VotesCountRule.Mode.MORE_THAN, VotesCountRule.Mode.LESS_THAN, VotesCountRule.Mode.EQUAL], unprototypedObj.mode))
            throw new ValidationException("VotesCountRule: unknown mode " + unprototypedObj.mode);
    }

    public getDescription(): string {
        let out = "The post has ";

        switch (this.mode) {
            case VotesCountRule.Mode.MORE_THAN: out += "more than";
            case VotesCountRule.Mode.LESS_THAN: out += "less than";
            case VotesCountRule.Mode.EQUAL: out += "";
            default: out += this.mode;
        }
        out += " " + this.value + " votes";

        return out;
    }
}

export namespace VotesCountRule {
    export enum Mode {
        MORE_THAN = "more_than",
        LESS_THAN = "less_than",
        EQUAL = "equal"
    }
}