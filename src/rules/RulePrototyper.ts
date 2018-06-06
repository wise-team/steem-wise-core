import * as _ from "lodash";

import { Rule } from "./Rule";
import { TagsRule } from "./TagsRule";
import { AuthorsRule } from "./AuthorsRule";
import { WeightRule } from "./WeightRule";
import { CustomRPCRule } from "./CustomRPCRule";

export class RulePrototyper {
    public static fromUnprototypedRule(unprototyped: Rule): Rule {
        if (unprototyped.validate) return unprototyped; // it already had prototype
        else if (unprototyped.rule === Rule.Type.Tags) {
            return RulePrototyper.prototypeRule(new TagsRule(TagsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Authors) {
            return RulePrototyper.prototypeRule(new AuthorsRule(AuthorsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Weight) {
            return RulePrototyper.prototypeRule(new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 0), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.CustomRPC) {
            return RulePrototyper.prototypeRule(new CustomRPCRule("", 0, "", ""), unprototyped);
        }
        else throw new Error("There is no rule with this type (rule=" + unprototyped.rule + ")");
    }

    private static prototypeRule<T extends Rule>(prototyperObj: T, unprototypedObj: object): T {
        prototyperObj.getRequiredProperties().forEach(prop => _.unset(prototyperObj, prop));
        return _.merge(prototyperObj, prototyperObj, unprototypedObj);
    }
}