/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */

import { Log } from "../log/Log";
import { Api } from "../api/Api";
import { ValidationException } from "./ValidationException";
import { Protocol } from "../protocol/Protocol";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { ValidationContext } from "./ValidationContext";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { SetRules } from "../protocol/SetRules";
import { Rule } from "../rules/Rule";
import { ImposedRules } from "../rules/ImposedRules";
import { ProggressCallback } from "../wise";
import { EffectuatedSetRules } from "../protocol/EffectuatedSetRules";

export class Validator {
    private api: Api;
    private proggressCallback: ProggressCallback = (msg: string, proggress: number): void => {};
    private concurrency: number = 4;
    private providedRulesets: EffectuatedSetRules | undefined = undefined;

    public constructor(api: Api) {
        this.api = api;
    }

    public withConcurrency(concurrency: number): Validator {
        this.concurrency = concurrency;
        return this;
    }

    public withProggressCallback(proggressCallback: ProggressCallback): Validator {
        this.proggressCallback = proggressCallback;
        return this;
    }

    public provideRulesets(rulesets: EffectuatedSetRules) {
        Log.log().cheapDebug(() => "VALIDATOR_PROVIDED_WITH_RULESETS=" + JSON.stringify(rulesets));
        this.providedRulesets = rulesets;
    }

    public async validate (delegator: string, voter: string, voteorder: SendVoteorder, atMoment: SteemOperationNumber): Promise<ValidationException | true> {
        Log.log().cheapDebug(() => "VALIDATOR_VALIDATE=" + JSON.stringify({delegator: delegator, voter: voter, voteorder: voteorder, atMoment: atMoment}));
        try {
            const context = new ValidationContext(this.api, delegator, voter, voteorder);

            this.validateVoteorderObject(voteorder);

            this.proggressCallback("Loading rulesets...", 0);
            let rulesets: SetRules;
            if (this.providedRulesets) {
                rulesets = this.providedRulesets;
            }
            else {
                const esrArray = await this.api.loadRulesets( { delegator: delegator, voter: voter }, atMoment);
                rulesets = ( esrArray.length > 0 ? esrArray[0] : { rulesets: [] });
            }
            Log.log().cheapDebug(() => "VALIDATOR_USING_RULESETS=" + JSON.stringify(rulesets));

            let rules = this.selectRuleset(rulesets, voteorder); // select correct ruleset (using rulesetName)
            rules = rules.concat(ImposedRules.getImposedRules(delegator, voter)); // apply imposed rules (this rules are necessary to prevent violations of some of the steem blockchain rules)

            this.proggressCallback("Validating rules...", 0.3);

            await this.validateRules(rules, voteorder, context);

            this.proggressCallback("Validation done", 1.0);
            return true;
        }
        catch (error) {
            if (ValidationException.isValidationException(error)) return error as ValidationException;
            else throw error;
        }
    }

    private validateVoteorderObject (voteorder: SendVoteorder) {
        if (typeof voteorder === "undefined") throw new ValidationException("Voteorder must not be empty");
        if (typeof voteorder.rulesetName === "undefined" || voteorder.rulesetName.length == 0) throw new ValidationException("Ruleset_name must not be empty");
        if (typeof voteorder.author === "undefined" || voteorder.author.length == 0) throw new ValidationException("Author must not be empty");
        if (typeof voteorder.permlink === "undefined" || voteorder.permlink.length == 0) throw new ValidationException("Permlink must not be empty");
        if (typeof voteorder.weight === "undefined" || isNaN(voteorder.weight)) throw new ValidationException("Weight must not be empty");
        if (voteorder.weight < -10000) throw new ValidationException("Weight must be greater or equal -10000");
        if (voteorder.weight > 10000) throw new ValidationException("Weight must be lesser or equal 10000");
    }

    private selectRuleset = (rulesets: SetRules, voteorder: SendVoteorder): Rule [] => {
        for (let i = 0; i < rulesets.rulesets.length; i++) {
            const ruleset = rulesets.rulesets[i];
            if (ruleset.name === voteorder.rulesetName) {
                Log.log().cheapDebug(() => "VALIDATOR_SELECTED_RULESET=" + JSON.stringify(ruleset.rules));
                return ruleset.rules;
            }
        }
        throw new ValidationException("Delegator had no such ruleset (name=" + voteorder.rulesetName + ") at specified datetime.");
    }

    private async validateRules (rules: Rule [], voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        await BluebirdPromise.resolve(rules)
        .map(async (rule) => {
            try {
                await rule.validate(voteorder, context);
                Log.log().cheapDebug(() => "VALIDATOR_RULE_VALIDATION_SUCCEEDED=" + JSON.stringify(rule));
            }
            catch (error) {
                Log.log().cheapDebug(() => "VALIDATOR_RULE_VALIDATION_FAILED=" + JSON.stringify({ rule: rule, error: error.message }));
                    throw error;
            }
        }, {  concurrency: this.concurrency });
    }
}