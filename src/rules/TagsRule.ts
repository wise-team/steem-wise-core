import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SteemPost } from "../blockchain/SteemPost";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { NotFoundException } from "../util/NotFoundException";
import { Promise } from "bluebird";

export class TagsRule extends Rule {
    public tags: string [];
    public mode: TagsRule.Mode;

    public constructor(mode: TagsRule.Mode, tags: string []) {
        super();

        this.mode = mode;
        this.tags = tags;
    }

    public type(): Rule.Type {
        return Rule.Type.Tags;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return context.getPost().then((post: SteemPost): Promise<void> => {
            return new Promise((resolve, reject) => {
                const postMetadata: SteemPost.JSONMetadata = JSON.parse(post.json_metadata) as SteemPost.JSONMetadata;

                if (this.mode === TagsRule.Mode.ALLOW) { // allow mode (every post tag must be within this list)
                    for (let i = 0; i < postMetadata.tags.length; i++) {
                        const tag = postMetadata.tags[i];
                        if (this.tags.indexOf(tag) === -1)
                                reject(new ValidationException("Tag " + tag + " is not on the allowed tags list [" + this.tags.join() + "]."));
                    }
                    resolve();
                }
                else if (this.mode === TagsRule.Mode.DENY) { // deny mode (none of post tags can be on this list)
                    for (let i = 0; i < postMetadata.tags.length; i++) {
                        const tag = postMetadata.tags[i];
                        if (this.tags.indexOf(tag) !== -1)
                                reject(new ValidationException("Tag " + tag + " is on the denied tags list [" + this.tags.join() + "]."));
                    }
                    resolve();
                }
                else if (this.mode === TagsRule.Mode.REQUIRE) { // the post should have all of the specified tags
                    for (let i = 0; i < this.tags.length; i++) {
                        const tag = this.tags[i];
                        if (postMetadata.tags.indexOf(tag) === -1)
                            reject(new ValidationException("The post tags [" + postMetadata.tags.join() + "] does not include " + tag + "."));
                    }
                    resolve();
                }
                else if (this.mode === TagsRule.Mode.ANY) { // the post should have at least one of the specified tags
                    for (let i = 0; i < this.tags.length; i++) {
                        const tag = this.tags[i];
                        if (postMetadata.tags.indexOf(tag) !== -1) {
                            resolve();
                            return;
                        }
                    }
                    reject(new ValidationException("None of the tags [" + postMetadata.tags.join() + "] is on the \"require\" tags list [" + this.tags.join() + "]."));
                }
                else reject(new ValidationException("Unknown mode in tags this."));
            });
        })
        .catch((e: Error) => {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        });
    }

}

export namespace TagsRule {
    export enum Mode {
        ALLOW, DENY, ANY, REQUIRE
    }
}