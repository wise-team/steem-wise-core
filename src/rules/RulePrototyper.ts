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
            return _.merge(new TagsRule(TagsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Authors) {
            return _.merge(new AuthorsRule(AuthorsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Weight) {
            return _.merge(new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 0), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.CustomRPC) {
            return _.merge(new CustomRPCRule("", 0, "", ""), unprototyped);
        }
        else throw new Error("There is no rule with this type (rule=" + unprototyped.rule + ")");
    }
}