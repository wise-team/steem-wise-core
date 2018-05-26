import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "../validation/ValidationError";
import { ValidationContext } from "../validation/ValidationContext";

export abstract class Rule {
    public abstract validate (
        op: SmartvotesOperation,
        context: ValidationContext,
        callback: (error: Error | undefined, result: ValidationError | true) => void
    ): void;

    public abstract type(): Rule.Type;
}

export namespace Rule {
    export enum Type {
        Authors, Weight, CustomRPC, Tags
    }
}