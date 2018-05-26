import { Rule } from "../rules/Rule";
import { SendVoteorder } from "./SendVoteorder";
import { ConfirmVote } from "./ConfirmVote";

export interface SetRules {
    rulesets: {
        name: string;
        rules: Rule [];
    } [];
}

/**
 * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
 */
export function isSetRules(cmd: SetRules | SendVoteorder | ConfirmVote): cmd is SetRules {
    return (<SetRules>cmd).rulesets !== undefined;
}