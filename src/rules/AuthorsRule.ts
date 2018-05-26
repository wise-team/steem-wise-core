import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "../validation/ValidationError";
import { ValidationContext } from "../validation/ValidationContext";

export class AuthorsRule extends Rule {
    private authors: string [];
    private mode: AuthorsRule.Mode;

    public constructor(mode: AuthorsRule.Mode, authors: string []) {
        super();

        this.mode = mode;
        this.authors = authors;
    }

    public type(): Rule.Type {
        return Rule.Type.Authors;
    }

    public validate (op: SmartvotesOperation, context: ValidationContext, callback: (error: Error | undefined, result: ValidationError | true) => void): void {
        const authorIsOnList: boolean = (this.authors.indexOf(context.getPost().author) !== -1);
        if (this.mode == AuthorsRule.Mode.ALLOW) {
            if (authorIsOnList) callback(undefined, true);
            else callback(undefined, new ValidationError("Author of the post is not on the allow list."));
        }
        else {
            if (authorIsOnList) callback(undefined, new ValidationError("Author of the post is on the deny list."));
            else callback(undefined, true);
        }
    }
}

export namespace AuthorsRule {
    export enum Mode {
        ALLOW, DENY
    }
}