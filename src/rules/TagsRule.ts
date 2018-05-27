import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "../validation/ValidationError";
import { ValidationContext } from "../validation/ValidationContext";
import { SteemPost } from "../blockchain/SteemPost";
import { SendVoteorder } from "../protocol/SendVoteorder";
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

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<true> {
        return new Promise((resolve, reject) => {
            const postMetadata: SteemPost.JSONMetadata = JSON.parse(context.getPost().json_metadata) as SteemPost.JSONMetadata;

            if (this.mode === TagsRule.Mode.ALLOW) { // allow mode (every post tag must be within this list)
                for (let i = 0; i < postMetadata.tags.length; i++) {
                    const tag = postMetadata.tags[i];
                    if (this.tags.indexOf(tag) === -1)
                            reject(new ValidationError("Tag " + tag + " is not on the allowed tags list [" + this.tags.join() + "]."));
                }
                resolve(true);
            }
            else if (this.mode === TagsRule.Mode.DENY) { // deny mode (none of post tags can be on this list)
                for (let i = 0; i < postMetadata.tags.length; i++) {
                    const tag = postMetadata.tags[i];
                    if (this.tags.indexOf(tag) !== -1)
                            reject(new ValidationError("Tag " + tag + " is on the denied tags list [" + this.tags.join() + "]."));
                }
                resolve(true);
            }
            else if (this.mode === TagsRule.Mode.REQUIRE) { // the post should have all of the specified tags
                for (let i = 0; i < this.tags.length; i++) {
                    const tag = this.tags[i];
                    if (postMetadata.tags.indexOf(tag) === -1)
                        reject(new ValidationError("The post tags [" + postMetadata.tags.join() + "] does not include " + tag + "."));
                }
                resolve(true);
            }
            else if (this.mode === TagsRule.Mode.ANY) { // the post should have at least one of the specified tags
                for (let i = 0; i < this.tags.length; i++) {
                    const tag = this.tags[i];
                    if (postMetadata.tags.indexOf(tag) !== -1) {
                        resolve(true);
                        return;
                    }
                }
                reject(new ValidationError("None of the tags [" + postMetadata.tags.join() + "] is on the \"require\" tags list [" + this.tags.join() + "]."));
            }
            else reject(new ValidationError("Unknown mode in tags this."));
        });
    }

}

export namespace TagsRule {
    export enum Mode {
        ALLOW, DENY, ANY, REQUIRE
    }
}