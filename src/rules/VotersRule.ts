/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";

import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SteemPost } from "../blockchain/SteemPost";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { NotFoundException } from "../util/NotFoundException";

export class VotersRule extends Rule {
    public rule: string = Rule.Type.Voters;
    public usernames: string [];
    public mode: VotersRule.Mode;

    public constructor(mode: VotersRule.Mode, usernames: string []) {
        super();

        this.mode = mode;
        this.usernames = usernames;
    }

    public type(): Rule.Type {
        return Rule.Type.Voters;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return BluebirdPromise.resolve()
        .then(() => this.validateRuleObject(this))
        .then(() => context.getPost())
        .then((post: SteemPost) => {
            const voters = post.active_votes.map(vote => vote.voter);

            if (this.mode === VotersRule.Mode.ONE) { // "one of" mode (every post voter must be within this list)
                for (let i = 0; i < voters.length; i++) {
                    const voter = voters[i];
                    if (this.usernames.indexOf(voter) === -1)
                        throw new ValidationException("VotersRule: " + voter + " is not on the allowed voters list [" + this.usernames.join() + "].");
                }
            }
            else if (this.mode === VotersRule.Mode.NONE) { // "none of" aka blacklist mode (none of post voters can be on this list)
                for (let i = 0; i < voters.length; i++) {
                    const voter = voters[i];
                    if (this.usernames.indexOf(voter) !== -1)
                        throw new ValidationException("VotersRule: " + voter + " is on the denied voters list [" + this.usernames.join() + "].");
                }
            }
            else if (this.mode === VotersRule.Mode.ALL) { // the post should have all of the specified voters
                for (let i = 0; i < this.usernames.length; i++) {
                    const voter = this.usernames[i];
                    if (voters.indexOf(voter) === -1)
                        throw new ValidationException("VotersRule: The post voters [" + voters.join() + "] does not include " + voter + ".");
                }
            }
            else if (this.mode === VotersRule.Mode.ANY) { // the post should have at least one of the specified voters
                for (let i = 0; i < this.usernames.length; i++) {
                    const voter = this.usernames[i];
                    if (voters.indexOf(voter) !== -1) {
                        return;
                    }
                }
                throw new ValidationException("VotersRule: None of the voters [" + voters.join() + "] is on the \"any\" voters list [" + this.usernames.join() + "].");
            }
            else throw new ValidationException("VotersRule: Unknown mode");
        })
        .catch((e: Error) => {
            if ((e as NotFoundException).notFoundException) throw new ValidationException(e.message);
            else throw e;
        });
    }

    public validateRuleObject(unprototypedObj: any) {
        ["usernames", "mode"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("VotersRule: property " + prop + " is missing");
        });
        if (!_.includes([VotersRule.Mode.ONE, VotersRule.Mode.NONE, VotersRule.Mode.ANY, VotersRule.Mode.ALL], unprototypedObj.mode))
            throw new ValidationException("VotersRule: unknown mode " + unprototypedObj.mode);
    }
}

export namespace VotersRule {
    export enum Mode {
        ONE = "one", // "one of" mode (every post voter must be within this list)
        NONE = "none", // "none of" - every voter must not be on the list
        ANY = "any", // "any of" - post should be voted on by at least one of the voters from the list
        ALL = "all" // "all of" - all usernames from the list must vote on the post
    }
}