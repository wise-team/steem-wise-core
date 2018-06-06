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
            return RulePrototyper.mergeMethods(new TagsRule(TagsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Authors) {
            return RulePrototyper.mergeMethods(new AuthorsRule(AuthorsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Weight) {
            return RulePrototyper.mergeMethods(new WeightRule(WeightRule.Mode.SINGLE_VOTE_WEIGHT, 0, 0), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.CustomRPC) {
            return RulePrototyper.mergeMethods(new CustomRPCRule("", 0, "", ""), unprototyped);
        }
        else throw new Error("There is no rule with this type (rule=" + unprototyped.rule + ")");
    }

    private static mergeMethods<T extends object>(prototypeObj: T, unprototypedObj: object): T {
        const methods: string [] = [];
        for (const m in prototypeObj) {
            if (typeof prototypeObj[m] == "function") {
                methods.push(m);
            }
        }
        return _.merge(_.pick(prototypeObj, methods), unprototypedObj) as object as T;
    }
}