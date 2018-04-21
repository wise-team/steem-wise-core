import { expect } from "chai";
import "mocha";

import { RulesValidator } from "../src/RulesValidator";
import { smartvotes_ruleset } from "../src/schema/rules.schema";


describe("RulesValidator", () => {
    describe("getRulesOfUser", () => {
        it("returns at leas two rulesets for user guest123", function (done) {
            this.timeout(10000);

            RulesValidator.getRulesOfUser("guest123", function(error: Error | undefined, result: smartvotes_ruleset []): void {
                if (error) done(error);
                else {
                    if (result.length >= 2) {
                        for (const i in result) console.log(result[i]);
                        done();
                    }
                    else done(new Error("Too few rulesets for guest123"));
                }
            });
        });
    });
});