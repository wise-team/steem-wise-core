import { Api } from "../api/Api";
import { ValidationError } from "./ValidationError";
import { Protocol } from "../protocol/Protocol";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { ProggressCallback } from "../ProggressCallback";
import { Promise } from "bluebird";
import { ValidationContext } from "./ValidationContext";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { SetRules } from "../protocol/SetRules";
import { Rule } from "../rules/Rule";

export class Validator {
    private api: Api;
    private protocol: Protocol;
    private proggressCallback: ProggressCallback = (msg: string, proggress: number): void => {};
    private concurrency: number = 4;

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


    public validate = (delegator: string, voter: string, voteorder: SendVoteorder, atMoment: SteemOperationNumber,
        callback: (error: Error | undefined, result: undefined | ValidationError | true) => void) => {

        const context = new ValidationContext(this.api, delegator, voter, voteorder);

        this.validateVoteorderObject(voteorder)
        .then(() => this.api.loadRulesets(delegator, voter, atMoment, this.protocol))
        .then((rulesets: SetRules) => this.selectRuleset(rulesets, voteorder))
        .then((rules: Rule []) => this.validateRules(rules, voteorder, context))
        .then(() => {
            callback(undefined, true);
        })
        .catch(error => {
            if ((error as ValidationError).validationError) callback(undefined, error);
            else callback(error, undefined);
        });

    }

    private validateVoteorderObject = (voteorder: SendVoteorder): Promise<void> => {
        return new Promise(function(resolve, reject) {
            if (typeof voteorder === "undefined") throw new ValidationError("Voteorder must not be empty");
            if (typeof voteorder.rulesetName === "undefined" || voteorder.rulesetName.length == 0) throw new ValidationError("Ruleset_name must not be empty");
            if (typeof voteorder.author === "undefined" || voteorder.author.length == 0) throw new ValidationError("Author must not be empty");
            if (typeof voteorder.permlink === "undefined" || voteorder.permlink.length == 0) throw new ValidationError("Permlink must not be empty");
            if (typeof voteorder.weight === "undefined" || isNaN(voteorder.weight)) throw new ValidationError("Weight must not be empty");
            if (voteorder.weight <= 0) throw new ValidationError("Weight must be greater than zero");
            if (voteorder.weight > 10000) throw new ValidationError("Weight must be lesser or equal 10000");
            resolve();
        });
    }

    private selectRuleset = (rulesets: SetRules, voteorder: SendVoteorder): Promise<Rule []> => {
        return new Promise(function(resolve, reject) {
            for (let i = 0; i < rulesets.rulesets.length; i++) {
                const ruleset = rulesets.rulesets[i];
                if (ruleset.name === voteorder.rulesetName) {
                    resolve(ruleset.rules);
                }
            }
            throw new ValidationError("Delegator had no such ruleset (name=" + voteorder.rulesetName + ") at specified datetime.");
        });
    }

    private validateRules = (rules: Rule [], voteorder: SendVoteorder, context: ValidationContext): Promise<void> => {
        return new Promise((resolve, reject) => {
            const validatorPromiseReturners: (() => Promise<boolean>) [] = [];
            for (let i = 0; i < rules.length; i++) {
                const rule = rules[i];
                validatorPromiseReturners.push(() => {
                    return rule.validate(voteorder, context);
                });
            }
            Promise.map(validatorPromiseReturners, (returner: () => Promise<boolean[]>) => { return returner(); }, { concurrency: this.concurrency })
            .then(function(values: any []) { // is this check redundant?
                const validityArray: boolean [] = values as boolean [];
                for (const i in validityArray) {
                    if (!validityArray[i]) throw new ValidationError("Rule validation failed");
                }
            })
            .then(function() { resolve(); })
            .catch(error => { reject(error); });
        });
    }
}