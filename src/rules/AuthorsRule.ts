import { Promise } from "bluebird";

import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "../validation/ValidationError";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { SteemPost } from "../blockchain/SteemPost";

export class AuthorsRule extends Rule {
    public authors: string [];
    public mode: AuthorsRule.Mode;

    public constructor(mode: AuthorsRule.Mode, authors: string []) {
        super();

        this.mode = mode;
        this.authors = authors;
    }

    public type(): Rule.Type {
        return Rule.Type.Authors;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<true> {
        return context.getPost().then((post: SteemPost): Promise<true> => {
            return new Promise((resolve, reject) => {
                const authorIsOnList: boolean = (this.authors.indexOf(post.author) !== -1);
                if (this.mode == AuthorsRule.Mode.ALLOW) {
                    if (authorIsOnList) resolve(true);
                    else reject(new ValidationError("Author of the post is not on the allow list."));
                }
                else {
                    if (authorIsOnList) reject(new ValidationError("Author of the post is on the deny list."));
                    else resolve(true);
                }
            });
        });
    }
}

export namespace AuthorsRule {
    export enum Mode {
        ALLOW, DENY
    }
}