import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "./ValidationError";

export class AuthorsRule extends Rule {
    private authors: string [];
    private mode: AuthorsRule.Mode;

    public constructor(mode: AuthorsRule.Mode, authors: string []) {
        super();

        this.mode = mode;
        this.authors = authors;
    }

    public validate (
        op: SmartvotesOperation,
        callback: (error: Error, result: ValidationError | undefined) => void
    ): void {
        throw new Error("Not implemented yet");
    }

}

export namespace AuthorsRule {
    export enum Mode {
        ALLOW, DENY
    }
}