import * as _ from "lodash";

import { Rule } from "./Rule";
import { TagsRule } from "./TagsRule";
import { AuthorsRule } from "./AuthorsRule";
import { WeightRule } from "./WeightRule";
import { CustomRPCRule } from "./CustomRPCRule";
import { ValidationException } from "../validation/ValidationException";
import { VotingPowerRule } from "./VotingPowerRule";
import { WeightForPeriodRule } from "./WeightForPeriodRule";
import { VotesCountRule } from "./VotesCountRule";

/**
 * This is a rule prototyper. Prototyping is done when rules are loaded from json file.
 */
export class RulePrototyper {
    public static fromUnprototypedRule(unprototyped: Rule): Rule {
        /* if rule implements validate, it means that it already had prototype */
        if (unprototyped.validate) return unprototyped;
        /* otherwise we have to append a prototype */
        else if (unprototyped.rule === Rule.Type.Tags) {
            return RulePrototyper.prototypeRule(new TagsRule(TagsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Authors) {
            return RulePrototyper.prototypeRule(new AuthorsRule(AuthorsRule.Mode.ALLOW, []), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Weight) {
            return RulePrototyper.prototypeRule(new WeightRule(0, 0), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.VotingPower) {
            return RulePrototyper.prototypeRule(new VotingPowerRule(VotingPowerRule.Mode.MORE_THAN, 0), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.WeightForPeriod) {
            return RulePrototyper.prototypeRule(new WeightForPeriodRule(0, WeightForPeriodRule.PeriodUnit.SECOND, 0), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.CustomRPC) {
            return RulePrototyper.prototypeRule(new CustomRPCRule("", 0, "", ""), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.AgeOfPost) {
            return RulePrototyper.prototypeRule(new AgeOfPostRule("", 0, "", ""), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.FirstPost) {
            return RulePrototyper.prototypeRule(new FirstPostRule("", 0, "", ""), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Payout) {
            return RulePrototyper.prototypeRule(new PayoutRule("", 0, "", ""), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.VotesCount) {
            return RulePrototyper.prototypeRule(new VotesCountRule(VotesCountRule.Mode.MORE_THAN, 0), unprototyped);
        }
        else if (unprototyped.rule === Rule.Type.Voters) {
            return RulePrototyper.prototypeRule(new VotersRule("", 0, "", ""), unprototyped);
        }
        else throw new ValidationException("There is no rule with this type (rule=" + unprototyped.rule + ")");
    }

    private static prototypeRule<T extends Rule>(prototyperRule: T, unprototypedObj: object): T {
        prototyperRule.validateRuleObject(unprototypedObj);
        return _.merge(prototyperRule, prototyperRule, unprototypedObj);
    }
}