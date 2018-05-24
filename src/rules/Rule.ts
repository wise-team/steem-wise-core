import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "./ValidationError";

export abstract class Rule {
    public abstract validate (
        op: SmartvotesOperation,
        callback: (error: Error, result: ValidationError | undefined) => void
    ): void;
}