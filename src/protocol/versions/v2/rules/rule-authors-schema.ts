/* tslint:disable class-name */

import { AuthorsRule } from "../../../../rules/AuthorsRule";
import { ValidationException } from "../../../../validation/ValidationException";

export interface wise_rule_authors {
    rule: "authors";
    mode: wise_rule_authors_mode;
    authors: string [];
}
export type wise_rule_authors_mode = "allow" | "deny";

export function wise_rule_authors_encode(r: AuthorsRule): wise_rule_authors {
    let mode: wise_rule_authors_mode;
    if ((r as AuthorsRule).mode === AuthorsRule.Mode.ALLOW) mode = "allow";
    else if ((r as AuthorsRule).mode === AuthorsRule.Mode.DENY) mode = "deny";
    else throw new ValidationException("Unknown mode of authors rule");

    const out: wise_rule_authors = {
        rule: "authors",
        mode: mode,
        authors: (r as AuthorsRule).authors
    };
    return out;
}

export function wise_rule_authors_decode(r: wise_rule_authors): AuthorsRule  {
    let mode: AuthorsRule.Mode;
    if (r.mode === "allow") mode = AuthorsRule.Mode.ALLOW;
    else if (r.mode === "deny") mode = AuthorsRule.Mode.DENY;
    else throw new ValidationException("v2:wise_rule_authors: unknown mode " + r.mode);

    return new AuthorsRule(mode, r.authors);
}
