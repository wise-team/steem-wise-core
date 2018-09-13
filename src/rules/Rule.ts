import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { RulePrototyper } from "./RulePrototyper";

export abstract class Rule {
    public rule: string = "not-set-in-inheriting-class";
    /**
     * Validates a voteorder.
     * @param voteorder - a voteorder
     * @param context - validation context (allows post loading, etc)
     * @throws ValidationException - when an voteorder is invalid according to this rule
     */
    public abstract validate (
        voteorder: SendVoteorder,
        context: ValidationContext,
    ): Promise<void>; // throws ValidationException

    /**
     * Validates an unprototyped rule object. It checks weather it has all required properties,
     * if modes are correct, and so on.
     */
    public abstract validateRuleObject(unprototypedRule: any): void; // throws a ValidationException

    public abstract type(): Rule.Type;
}

export namespace Rule {
    export enum Type {
        Tags = "tags",
        Authors = "authors",
        Weight = "weight",
        WeightForPeriod = "weight_for_period",
        CustomRPC = "custom_rpc",
        VotingPower = "voting_power",
        VotesCount = "votes_count",
        Voters = "voters",
        FirstPost = "first_post",
        Payout = "payout",
        AgeOfPost = "age_of_post",
        ExpirationDate = "expiration_date",
    }
}

export namespace Rule {
    /**
     * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
     */
    export function isRule(o: object): o is Rule {
        return (<Rule>o).rule !== undefined;
    }
}