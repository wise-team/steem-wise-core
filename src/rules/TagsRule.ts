import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "./ValidationError";

export class TagsRule extends Rule {
    private tags: string [];
    private mode: TagsRule.Mode;

    public constructor(mode: TagsRule.Mode, tags: string []) {
        super();

        this.mode = mode;
        this.tags = tags;
    }

    public validate (
        op: SmartvotesOperation,
        callback: (error: Error, result: ValidationError | undefined) => void
    ): void {
        throw new Error("Not implemented yet");
    }

}

export namespace TagsRule {
    export enum Mode {
        ALLOW, DENY, ANY, REQUIRE
    }
}