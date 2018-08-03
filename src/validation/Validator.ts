import * as _log from "loglevel"; const log = _log.getLogger("steem-wise-core");

import { Api } from "../api/Api";
import { ValidationException } from "./ValidationException";
import { Protocol } from "../protocol/Protocol";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { ProggressCallback } from "../ProggressCallback";
import { Promise } from "bluebird";
import { ValidationContext } from "./ValidationContext";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { SetRules, EffectuatedSetRules } from "../protocol/SetRules";
import { Rule } from "../rules/Rule";
import { ImposedRules } from "../rules/ImposedRules";
import { NotFoundException } from "../util/NotFoundException";

export class Validator {
    private api: Api;
    private protocol: Protocol;
    private proggressCallback: ProggressCallback = (msg: string, proggress: number): void => {};
    private concurrency: number = 4;
    private providedRulesets: EffectuatedSetRules | undefined = undefined;

    public constructor(api: Api, protocol: Protocol) {
        this.api = api;
        this.protocol = protocol;
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
        this.providedRulesets = rulesets;
    }

    public validate = (delegator: string, voter: string, voteorder: SendVoteorder, atMoment: SteemOperationNumber): Promise<ValidationException | true> => {
        const context = new ValidationContext(this.api, this.protocol, delegator, voter, voteorder);

        return new Promise<ValidationException | true>((resolve, reject) => {
            this.validateVoteorderObject(voteorder)
            .then(() => {
                if (this.providedRulesets) return Promise.resolve(this.providedRulesets);
                else return this.api.loadRulesets(delegator, voter, atMoment, this.protocol);
            })
            .then((rulesets: SetRules) => this.selectRuleset(rulesets, voteorder)) // select correct ruleset (using rulesetName)
            .then((rules: Rule []) => rules.concat(ImposedRules.getImposedRules(delegator, voter))) // apply imposed rules (this rules are necessary to prevent violations of some of the steem blockchain rules)
            .then((rules: Rule []) => {
                return this.validateRules(rules, voteorder, context);
            })
            .then(() => {
                resolve(true);
            }, (error: Error | ValidationException) => {
                if ((error as ValidationException).validationException) {
                    resolve(error as ValidationException);
                }
                else {
                    reject(error);
                }
            });
        });

    }

    private validateVoteorderObject = (voteorder: SendVoteorder): Promise<void> => {
        return new Promise(function(resolve, reject) {
            if (typeof voteorder === "undefined") throw new ValidationException("Voteorder must not be empty");
            if (typeof voteorder.rulesetName === "undefined" || voteorder.rulesetName.length == 0) throw new ValidationException("Ruleset_name must not be empty");
            if (typeof voteorder.author === "undefined" || voteorder.author.length == 0) throw new ValidationException("Author must not be empty");
            if (typeof voteorder.permlink === "undefined" || voteorder.permlink.length == 0) throw new ValidationException("Permlink must not be empty");
            if (typeof voteorder.weight === "undefined" || isNaN(voteorder.weight)) throw new ValidationException("Weight must not be empty");
            if (voteorder.weight < -10000) throw new ValidationException("Weight must be greater or equal -10000");
            if (voteorder.weight > 10000) throw new ValidationException("Weight must be lesser or equal 10000");
            resolve();
        });
    }

    private selectRuleset = (rulesets: SetRules, voteorder: SendVoteorder): Promise<Rule []> => {
        return new Promise(function(resolve, reject) {
            for (let i = 0; i < rulesets.rulesets.length; i++) {
                const ruleset = rulesets.rulesets[i];
                if (ruleset.name === voteorder.rulesetName) {
                    resolve(ruleset.rules);
                    return;
                }
            }
            throw new ValidationException("Delegator had no such ruleset (name=" + voteorder.rulesetName + ") at specified datetime.");
        });
    }

    private validateRules = (rules: Rule [], voteorder: SendVoteorder, context: ValidationContext): Promise<void> => {
        return Promise.resolve()
        .then(() => {
            const validatorPromiseReturners: (() => Promise<void>) [] = [];
            for (let i = 0; i < rules.length; i++) {
                const rule = rules[i];
                validatorPromiseReturners.push(() => {
                    return rule.validate(voteorder, context);
                });
            }
            return validatorPromiseReturners;
        }).map((returner: () => Promise<void []>) => { return returner(); }, { concurrency: this.concurrency })
        .then(() => {});
    }
}