import { Promise } from "bluebird";
import * as _ from "lodash";

import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { NotFoundException } from "../util/NotFoundException";
import { AccountInfo } from "../blockchain/AccountInfo";

export class VotingPowerRule extends Rule {
    public rule: string = Rule.Type.VotingPower;
    public value: number;
    public mode: VotingPowerRule.Mode;

    public constructor(mode: VotingPowerRule.Mode, value: number) {
        super();

        this.mode = mode;
        this.value = value;
    }

    public type(): Rule.Type {
        return Rule.Type.Authors;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return Promise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => context.getAccountInfo(context.getDelegatorUsername()))
        .then((delegatorAccount: AccountInfo) => {
            if (!delegatorAccount) throw new Error("Delegator account info is undefined");

            if (this.mode == VotingPowerRule.Mode.EQUAL) {
                if (delegatorAccount.voting_power !== this.value)
                    throw new ValidationException("Delegator voting power (" + delegatorAccount.voting_power + ") does not equal " + this.value);
            }
            else if (this.mode == VotingPowerRule.Mode.MORE_THAN) {
                if (delegatorAccount.voting_power <= this.value)
                throw new ValidationException("Delegator voting power (" + delegatorAccount.voting_power + ") is not more than " + this.value);
            }
            else if (this.mode == VotingPowerRule.Mode.LESS_THAN) {
                if (delegatorAccount.voting_power >= this.value)
                throw new ValidationException("Delegator voting power (" + delegatorAccount.voting_power + ") is not less than " + this.value);
            }
            else {
                throw new Error("Unknown mode of voting power rule: " + this.mode);
            }
        })
        .catch((e: Error) => {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["value", "mode"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("VotingPowerRule: property " + prop + " is missing");
        });
        if (_.includes([VotingPowerRule.Mode.MORE_THAN, VotingPowerRule.Mode.LESS_THAN, VotingPowerRule.Mode.EQUAL], unprototypedObj.mode))
            throw new ValidationException("VotingPowerRule: unknown mode " + unprototypedObj.mode);
    }
}

export namespace VotingPowerRule {
    export enum Mode {
        MORE_THAN = "more_than",
        LESS_THAN = "less_than",
        EQUAL = "equal"
    }
}