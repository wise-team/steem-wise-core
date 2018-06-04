import { Promise } from "bluebird";

import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { SteemPost } from "../blockchain/SteemPost";
import { NotFoundException } from "../util/NotFoundException";

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

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return context.getPost()
        .then((post: SteemPost): Promise<void> => {
            return new Promise((resolve, reject) => {
                const authorIsOnList: boolean = (this.authors.indexOf(post.author) !== -1);
                if (this.mode == AuthorsRule.Mode.ALLOW) {
                    if (authorIsOnList) resolve();
                    else reject(new ValidationException("Author of the post is not on the allow list."));
                }
                else {
                    if (authorIsOnList) reject(new ValidationException("Author of the post is on the deny list."));
                    else resolve();
                }
            });
        })
        .catch((e: Error) => {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        });
    }
}

export namespace AuthorsRule {
    export enum Mode {
        ALLOW = "ALLOW",
        DENY = "DENY"
    }
}