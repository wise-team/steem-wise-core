import * as _ from "lodash";

import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { NotFoundException } from "../util/NotFoundException";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { SteemPost } from "../blockchain/SteemPost";
import { Rule } from "./Rule";

export class AuthorsRule extends Rule {
    public rule: string = Rule.Type.Authors;
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

    public async validate (voteorder: SendVoteorder, context: ValidationContext) {
        this.validateRuleObject(this);
        let post;
        try {
            post = await context.getPost();
        }
        catch (e) {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        }

        const authorIsOnList: boolean = (this.authors.indexOf(post.author) !== -1);
        if (this.mode == AuthorsRule.Mode.ALLOW) {
            if (!authorIsOnList) throw new ValidationException("Author of the post is not on the allow list.");
        }
        else {
            if (authorIsOnList) throw new ValidationException("Author of the post is on the deny list.");
        }
    }

    public validateRuleObject(unprototypedObj: any) {
        ["authors", "mode"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("AuthorsRule: property " + prop + " is missing");
        });
        if (!_.includes([AuthorsRule.Mode.ALLOW, AuthorsRule.Mode.DENY], unprototypedObj.mode))
            throw new ValidationException("AuthorsRule: unknown mode " + unprototypedObj.mode);
    }

    public getDescription(): string {
        return (this.mode === "allow" ? "Allowed" : "Denied")
            + " " + _.join(this.authors, ", ");
    }
}

export namespace AuthorsRule {
    export enum Mode {
        ALLOW = "allow",
        DENY = "deny"
    }
}