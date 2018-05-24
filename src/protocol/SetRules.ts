import { Rule } from "../rules/Rule";

export interface SetRules {
    rulesets: {
        name: string;
        rules: Rule [];
    } [];
}