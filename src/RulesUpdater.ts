/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";

import { Api } from "./api/Api";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { SetRules } from "./protocol/SetRules";
import { Protocol } from "./protocol/Protocol";
import { WiseOperation } from "./protocol/WiseOperation";
import { ProggressCallback, Callback, Wise } from "./wise";
import { Util } from "./util/util";
import { RulePrototyper } from "./rules/RulePrototyper";
import { Ruleset } from "./protocol/Ruleset";
import { EffectuatedSetRules } from "./protocol/EffectuatedSetRules";
import { SetRulesForVoter } from "./protocol/SetRulesForVoter";

export class RulesUpdater {
    public static async uploadRulesetsForVoter(
        api: Api, protocol: Protocol, delegator: string, voter: string, rulesets_: Ruleset [],
        proggressCallback?: ProggressCallback
    ): Promise<SteemOperationNumber> {
        if (!voter || !voter.length)
            throw new Error("Voter cannot be undefined or empty");
        if (!rulesets_)
            throw new Error("Rulesets cannot be undefined");
        if (!Array.isArray(rulesets_))
            throw new Error("Rulesets must be an array");
        if (rulesets_.filter(ruleset => !Ruleset.validateRuleset(ruleset)).length > 0)
            throw new Error("Rulesets must contain valid rulesets. Invalid rulesets: "
            + JSON.stringify(rulesets_.filter(ruleset => !Ruleset.validateRuleset(ruleset))));

        /**
         * Prototype
         */
        const rulesets = rulesets_.map(ruleset => RulePrototyper.prototypeRuleset(ruleset));
        // the above method will throw error on invalid rule object
        // it also validates the structure of a ruleset

        /**
         * Send to blockchain
         */
        const wiseOp: WiseOperation = {
            voter: voter,
            delegator: delegator,
            command: { rulesets: rulesets } as SetRules
        };
        const steemOps: [string, object][] = protocol.serializeToBlockchain(wiseOp);
        if (steemOps.length !== 1) throw new Error("SetRules should be a single blockchain operation");
        if (!protocol.validateOperation(steemOps[0])) throw new Error("Operation object has invalid structure");
        if (proggressCallback) proggressCallback("Sending rules to blockchain...", 0.0);

        const resultSon = await api.sendToBlockchain(steemOps);
        if (proggressCallback) proggressCallback("Sent to blockchain (" + resultSon.toString() + ")", 1.0);
        return resultSon;
    }

    public static async downloadAllRulesets(api: Api, protocol: Protocol, delegator: string, moment: SteemOperationNumber = SteemOperationNumber.FUTURE): Promise<EffectuatedSetRules []> {
        const currentRulesets = await api.loadAllRulesets(delegator, moment, protocol);
        if (currentRulesets.length == 0) return [];

        const rulesByVoter: [string, EffectuatedSetRules []][] = _.toPairs(_.groupBy(currentRulesets, (r: EffectuatedSetRules) => r.voter));

        const rules = rulesByVoter.map((votersRuleHistory: [string, EffectuatedSetRules []]) => {
            return votersRuleHistory[1].reduce((newestRules: EffectuatedSetRules, testedRules: EffectuatedSetRules) => {
                if (testedRules.moment.isGreaterThan(newestRules.moment)) return testedRules;
                else return newestRules;
            }, votersRuleHistory[1][0]);
        });
        // the following filter removes voters with cleared (empty) rules
        return _.filter(rules, rulesForSingleVoter => rulesForSingleVoter.rulesets.length > 0);
    }

    public static async uploadAllRulesets(api: Api, protocol: Protocol, delegator: string,
            newRules: SetRulesForVoter [], proggressCallback: ProggressCallback
    ): Promise<SteemOperationNumber | true> {
        /**
         * Validate input
         */
        const invalidRulesetsForVoter = newRules.filter(r => !SetRulesForVoter.validateSetRulesForVoter(r));
        if (invalidRulesetsForVoter.length > 0)
            throw new Error("There are invalid rulesets: " + invalidRulesetsForVoter); // can throw inside promise

        /**
         * Validate rulesets
         */
        newRules.forEach((rulesetsForVoter: SetRulesForVoter) => {
            if (!SetRulesForVoter.validateSetRulesForVoter(rulesetsForVoter))
                throw new Error("Invalid ruleset: " + JSON.stringify(rulesetsForVoter));

            rulesetsForVoter.rulesets.forEach(ruleset => ruleset.rules.forEach(
                rule => {
                    const prototypedRule = RulePrototyper.fromUnprototypedRule(rule);
                    try {
                        prototypedRule.validateRuleObject(rule);
                    }
                    catch (error) {
                        throw new Error("Invalid rule " + JSON.stringify(rule) + " in ruleset \"" + ruleset.name
                                + "\" for voter " + rulesetsForVoter.voter + ": " + error.message);
                    }
                }
            ));
        });

        /**
         * Download current rules
         */
        const currentRules: EffectuatedSetRules [] = await RulesUpdater.downloadAllRulesets(api, protocol, delegator);

        /**
         * Decide which rules to send
         */
        // decide what operations are needed to be sent
        // map all rules to format: { [voter: string]: { current: ? : updated: ? } }
        type RulesByVoterValue = { current: SetRules|undefined, updated: SetRules|undefined }; // { voter: string, rulesets: SetRules, updated: boolean };
        type RulesByVoter = { [voter: string]: RulesByVoterValue };

        // ensure each Rule has prototype in newRules
        newRules.forEach((srfv: SetRulesForVoter) => srfv.rulesets.forEach(
            rulesInRuleset => rulesInRuleset.rules.forEach(
                (rule, index) => rulesInRuleset.rules[index] = RulePrototyper.fromUnprototypedRule(rule)
            )
        ));

        const rulesByVoter: RulesByVoter = _.concat(
            currentRules.map(r => [r.voter, { current: r, updated: undefined }] as [string, RulesByVoterValue]),
            newRules.map(r => [r.voter, { current: undefined, updated: r }] as [string, RulesByVoterValue])
        ).reduce((obj: RulesByVoter, elem: [string, RulesByVoterValue]): RulesByVoter => {
            /*if (obj[elem[0]]) (obj[elem[0]] as object []).push(elem[1]);
            else obj[]
            return obj;*/
            const newObj: RulesByVoter = {};
            newObj[elem[0]] = elem[1];
            return _.merge(obj, newObj);
        }, {});

        /**
         * Create a list of operations to perform
         */
        const operationsToPerform: WiseOperation [] = [];
        _.forOwn(rulesByVoter, (situation: RulesByVoterValue, voter: string, object: RulesByVoter) => {
            if (situation.current && !situation.updated && situation.current.rulesets.length > 0 /* if length == 0 it means that the rules were voided */) {
                // delete rules
                proggressCallback("Planning updating rules: rules for " + voter + " will be voided.", 0);
                operationsToPerform.push(RulesUpdater.sendRules(voter, delegator, { rulesets: [] }));
            }
            else if (!situation.current && situation.updated) {
                // create rules
                proggressCallback("Planning updating rules: rules for " + voter + " will be created: " + JSON.stringify(situation.updated), 0);
                operationsToPerform.push(RulesUpdater.sendRules(voter, delegator, situation.updated));
            }
            else if (situation.current && situation.updated) {
                // compare rules, send if differ
                if (RulesUpdater.diffRules(situation.current, situation.updated)) {
                    proggressCallback("Planning updating rules: rules for " + voter + " will be updated: current="
                            + JSON.stringify(situation.current) + ", new=" + JSON.stringify(situation.updated), 0);
                    operationsToPerform.push(RulesUpdater.sendRules(voter, delegator, situation.updated));
                }
            }

            return operationsToPerform;
        });

        if (operationsToPerform.length === 0) return true;
        else {
            proggressCallback("Updating rules: " + operationsToPerform.length + " operations to send...", 0);
            let moment = SteemOperationNumber.NEVER;
            for (let i = 0; i < operationsToPerform.length; i++) {
                const op: WiseOperation = operationsToPerform[i];
                const num = i + 1;
                proggressCallback("Updating rules: Sending operation " + num + "/" + operationsToPerform.length + "...", (num / operationsToPerform.length));

                moment = await api.sendToBlockchain(protocol.serializeToBlockchain(op));

                proggressCallback("Updating rules: Sent operation " + num + "/" + operationsToPerform.length
                    + " (" + moment + ")", ((num + 1) / operationsToPerform.length));
            }

            proggressCallback("Done updating rules.", 1);
            return moment;
        }
    }

    public static sendRules(voter: string, delegator: string, rulesCmd: SetRules): WiseOperation {
        return {
            voter: voter,
            delegator: delegator,
            command: rulesCmd
        };
    }

    public static diffRules(a: SetRules, b: SetRules): boolean {
        return !_.isEqual(a.rulesets, b.rulesets);
        // we have to compare a.rulesets to b.rulesets instead of comparing a to b,
        // because either a or be can be an EffectuatedSetRules object, which contains additional properties
    }
}
