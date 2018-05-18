import { Promise } from "bluebird";

import * as schemaJSON from "../../smartvotes.schema.json";
import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_rule_authors,
    smartvotes_rule_tags, smartvotes_rule_custom_rpc, smartvotes_rule, smartvotes_ruleset } from "../schema/smartvotes.schema";
import { SteemPost, SteemPostJSONMetadata } from "../blockchain/blockchain-operations-types";
import { ValidationError } from "./ValidationError";
import { JSONValidator } from "./JSONValidator";
import { TagsRuleValidator } from "./TagsRuleValidator";
import { AuthorsRuleValidator } from "./AuthorsRuleValidator";
import { CustomRPCRuleValidator } from "./CustomRPCRuleValidator";
import { SimpleTaker,
    ToSmartvotesOperationTransformer, SmartvotesOperationTypeFilter,
    ChainableLimiter, OperationNumberFilter } from "../chainable/_exports";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { RulesetsAtMoment } from "../validation/smartvote-types-at-moment";
import { ApiFactory } from "../api/ApiFactory";

/**
 * The RulesValidator validates vote orders against delegator's rulesets.
 */
export class RulesValidator {
    private steem: any;
    private apiFactory: ApiFactory;
    private providedRulesets: RulesetsAtMoment [] | undefined = undefined;
    private concurrency: number = 4;

    constructor(steem: any, apiFactory: ApiFactory) {
        this.steem = steem;
        this.apiFactory = apiFactory;
    }

    public provideRulesetsForValidation(providedRulesets: RulesetsAtMoment []): RulesValidator {
        this.providedRulesets = providedRulesets;
        return this;
    }

    public withConcurrency(concurrency: number): RulesValidator {
        this.concurrency = concurrency;
        return this;
    }

    /**
     * Fetches smartvotes rules of specified steem user, which were valid at
     * specified time (could be now — 'new Date()')
     * @param {string} username — a steem username of the Delegator
     * @param {Date} atMoment - // TODO comment
     *  If you specify past date — the result will be the rules which were valid at that moment
     */
    public getRulesOfUser = (username: string, atMoment: SteemOperationNumber = SteemOperationNumber.FUTURE): Promise<smartvotes_ruleset []> => {
        return new Promise((resolve, reject) => {
            if (typeof username === "undefined" || username.length == 0) throw new Error("Username must not be empty");

            const loadedRulesets: smartvotes_ruleset [] = [];

            let noResult: boolean = true;
            this.apiFactory.createSmartvotesSupplier(this.steem, username)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                .chain(new ToSmartvotesOperationTransformer())
                .chain(new SmartvotesOperationTypeFilter<smartvotes_command_set_rules>("set_rules"))
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: smartvotes_command_set_rules): boolean => {
                    noResult = false;
                    resolve(item.rulesets);
                    return false;
                }))
                .catch((error: Error) => {
                    noResult = false;
                    reject(error);
                    return false;
                });
            })
            .start(() => {
                if (noResult) resolve([]);
            });
        });
    }

    /**
     * Validates a vote order which was or possibly will be sent by specified user. The vote order
     *  should specify a name of the ruleset against which it will be validated, and which was
     *  set in the newest (at publishDate moment) set_rules of the Delegator
     * @param {string} username — a steem username of the Voter
     * @param {smartvotes_voteorder} voteorder  — a voteorder object
     * @param // TODO comment
     * @param {(error: Error | undefined, result: boolean) => void} callback — a callback (can be promisified)
     */
    // TODO validation error should be different from generic error
    public validateVoteOrder = (username: string, voteorder: smartvotes_voteorder, at: SteemOperationNumber,
        callback: (error: Error | undefined, result: boolean) => void,
        proggressCallback?: (msg: string, proggress: number) => void, skipWeightCheck: boolean = false): void => {

        const notifyProggress = function(msg: string, proggress: number) {
            if (proggressCallback) proggressCallback(msg, proggress);
        };

        this.validateVoteorderObject({ username: username, voteorder: voteorder, at: at})
        .then(function(input: any) { notifyProggress("Loading rulesets", 0.2); return input; })
        /**/.then(this.loadRulesets)
        /**/.then(this.checkRuleset)
        /**/.then(this.checkMode)
        .then(function(input: any) { if (!skipWeightCheck) notifyProggress("Checking weight", 0.4); return input; })
        /**/.then((input: any) => { if (!skipWeightCheck) return this.checkWeight(input); else return input; })
        .then(function(input: any) { notifyProggress("Loading post", 0.6); return input; })
        /**/.then(this.loadPost)
        .then(function(input: any) { notifyProggress("Validating rules", 0.8); return input; })
        /**/.then(this.validateRules)
        .then(function() { callback(undefined, true); })
        .catch(error => { callback(error, false); });
    }

    // TODO comment
    public validatePotentialVoteOrder = (username: string, voteorder: smartvotes_voteorder,
        callback: (error: Error | undefined, result: boolean) => void,
        proggressCallback?: (msg: string, proggress: number) => void): void => {
            this.validateVoteOrder(username, voteorder, SteemOperationNumber.FUTURE, callback, proggressCallback, true);
    }

    private validateVoteorderObject = (input: { username: string, voteorder: smartvotes_voteorder, at: SteemOperationNumber }): Promise<{ username: string, voteorder: smartvotes_voteorder, at: SteemOperationNumber }> => {
        return new Promise(function(resolve, reject) {
            const voteorder: smartvotes_voteorder = input.voteorder;
            if (typeof voteorder === "undefined") throw new ValidationError("Voteorder must not be empty");
            if (typeof voteorder.delegator === "undefined" || voteorder.delegator.length == 0) throw new ValidationError("Delegator must not be empty");
            if (typeof voteorder.ruleset_name === "undefined" || voteorder.ruleset_name.length == 0) throw new ValidationError("Ruleset_name must not be empty");
            if (typeof voteorder.author === "undefined" || voteorder.author.length == 0) throw new ValidationError("Author must not be empty");
            if (typeof voteorder.permlink === "undefined" || voteorder.permlink.length == 0) throw new ValidationError("Permlink must not be empty");
            if (typeof voteorder.type === "undefined" || voteorder.type.length == 0) throw new ValidationError("Type must not be empty");
            if (!(voteorder.type === "upvote" || voteorder.type === "flag")) throw new ValidationError("Type must be: upvote or flag");
            if (typeof voteorder.weight === "undefined" || isNaN(voteorder.weight)) throw new ValidationError("Weight must not be empty");
            if (voteorder.weight <= 0) throw new ValidationError("Weight must be greater than zero");
            if (voteorder.weight > 10000) throw new ValidationError("Weight must be lesser or equal 10000");
            resolve(input);
        });
    }

    private loadRulesets = (input: { username: string, voteorder: smartvotes_voteorder, at: SteemOperationNumber }): Promise<{ username: string, voteorder: smartvotes_voteorder, rulesets: smartvotes_ruleset []}> => {
        if (this.providedRulesets) {
            const providedRulesets = this.providedRulesets;
            return new Promise((resolve, reject) => {
                for (let i = 0; i < providedRulesets.length; i++) {
                    const rulesetsAtMoment = providedRulesets[i];
                    if (input.at.isGreaterThan(rulesetsAtMoment.opNum) && input.at.isLesserThan(rulesetsAtMoment.validityUntil)) {
                        resolve({ username: input.username, voteorder: input.voteorder, rulesets: rulesetsAtMoment.rulesets});
                        return;
                    }
                }
                throw new ValidationError("Provided rulesets does not specify any set of rulesets for specified moment.");
            });
        }
        else {
            return this.getRulesOfUser(input.voteorder.delegator, input.at)
                .then(function(result: smartvotes_ruleset []) {
                    return ({ username: input.username, voteorder: input.voteorder, rulesets: result});
                });
        }
    }

    private checkRuleset = (input: { username: string, voteorder: smartvotes_voteorder, rulesets: smartvotes_ruleset [] }): Promise<{ username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset}> => {
        return new Promise(function(resolve, reject) {
            for (const i in input.rulesets) {
                if (input.rulesets[i].name == input.voteorder.ruleset_name) {
                    resolve({ username: input.username, voteorder: input.voteorder, ruleset: input.rulesets[i] });
                }
            }
            throw new ValidationError("Delegator had no such ruleset (name=" + input.voteorder.ruleset_name + ") at specified datetime.");
        });
    }

    private checkMode = (input: { username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset }): Promise<{ username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset }> => {
        return new Promise(function(resolve, reject) {
            if (input.ruleset.voter !== input.username) throw new ValidationError("This ruleset do not allow " + input.username + " to vote.");

            if (input.ruleset.action !== "upvote+flag") {
                if (input.voteorder.type !== input.ruleset.action) throw new ValidationError("This ruleset do not allow " + input.voteorder.type + " action");
            }

            resolve(input);
        });
    }

    private checkWeight = (input: { username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset }): Promise<{ username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset }> => {
        return new Promise(function(resolve, reject) {
            // TODO total vote weight calculator
            if (input.voteorder.weight > input.ruleset.total_weight) throw new ValidationError("Total vote weight allowed by this ruleset was exceeded.");

            resolve(input);
        });
    }

    private loadPost = (input: { username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset }): Promise<{ username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset, post: SteemPost }> => {
        return new Promise((resolve, reject) => {
            this.steem.api.getContent(input.voteorder.author, input.voteorder.permlink, function(error: Error, result: any) {
                if (error) reject(error);
                else resolve({ username: input.username, voteorder: input.voteorder, ruleset: input.ruleset, post: result });
            });
        });
    }

    private validateRules = (input: { username: string, voteorder: smartvotes_voteorder, ruleset: smartvotes_ruleset, post: SteemPost}): Promise<true> => {
        return new Promise((resolve, reject) => {
            const ruleset = input.ruleset;
            const post = input.post;
            const voteorder = input.voteorder;

            const validatorPromiseReturners: (() => Promise<boolean>) [] = [];
            for (let i = 0; i < ruleset.rules.length; i++) {
                const rule = ruleset.rules[i];
                switch (rule.type) {
                    case "authors":
                        validatorPromiseReturners.push(() => {
                            return new AuthorsRuleValidator().validate(voteorder, rule as smartvotes_rule_authors, post);
                        });
                        break;

                    case "tags":
                        validatorPromiseReturners.push(() => {
                            return new TagsRuleValidator().validate(voteorder, rule as smartvotes_rule_tags, post);
                        });
                        break;

                    case "custom_rpc":
                        validatorPromiseReturners.push(() => {
                            return new CustomRPCRuleValidator().validate(voteorder, rule as smartvotes_rule_custom_rpc, post);
                        });
                        break;

                    default:
                        throw new Error("Unknown rule type");
                }
            }
            Promise.map(validatorPromiseReturners, (returner: () => Promise<boolean[]>) => { return returner(); }, { concurrency: this.concurrency })
            .then(function(values: any []) { // is this check redundant?
                const validityArray: boolean [] = values as boolean [];
                for (const i in validityArray) {
                    if (!validityArray[i]) throw new ValidationError("Rule validation failed");
                }
            })
            .then(function() { resolve(true); })
            .catch(error => { reject(error); });
        });
    }
}