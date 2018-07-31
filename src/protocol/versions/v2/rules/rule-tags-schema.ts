/* tslint:disable class-name */

import { TagsRule } from "../../../../rules/TagsRule";
import { ValidationException } from "../../../../validation/ValidationException";

export interface wise_rule_tags {
    rule: "tags";
    mode: wise_rule_tags_mode;
    tags: string [];
}
export type wise_rule_tags_mode = "allow" | "deny" | "any" | "require";


export function wise_rule_tags_encode(r: TagsRule): wise_rule_tags {
    let mode: wise_rule_tags_mode;
    if (r.mode === TagsRule.Mode.ALLOW) mode = "allow";
    else if (r.mode === TagsRule.Mode.DENY) mode = "deny";
    else if (r.mode === TagsRule.Mode.ANY) mode = "any";
    else if (r.mode === TagsRule.Mode.REQUIRE) mode = "require";
    else throw new ValidationException("TagsRule: unknown mode " + r.mode);

    const out: wise_rule_tags = {
        rule: "tags",
        mode: mode,
        tags: r.tags
    };
    return out;
}

export function wise_rule_tags_decode(r: wise_rule_tags): TagsRule  {
    let mode: TagsRule.Mode;
    if (r.mode === "allow") mode = TagsRule.Mode.ALLOW;
    else if (r.mode === "deny") mode = TagsRule.Mode.DENY;
    else if (r.mode === "require") mode = TagsRule.Mode.REQUIRE;
    else if (r.mode === "any") mode = TagsRule.Mode.ANY;
    else throw new ValidationException("v2:wise_rule_tags: unknown mode " + r.mode);

    return new TagsRule(mode, r.tags);
}
