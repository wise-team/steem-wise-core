import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";

export abstract class Rule {
    public rule: string = "not-set-in-inheriting-class";
    /**
     * Validates a voteorder.
     * @param voteorder — a voteorder
     * @param context — validation context (allows post loading, etc)
     * @throws ValidationException — when an voteorder is invalid according to this rule
     */
    public abstract validate (
        voteorder: SendVoteorder,
        context: ValidationContext,
    ): Promise<void>; // throws ValidationException

    public abstract type(): Rule.Type;
}

export namespace Rule {
    export enum Type {
        Tags = "tags",
        Authors = "authors",
        Weight = "weight",
        CustomRPC = "custom_rpc",
    }
}