import * as _ from "lodash";

import { Api } from "./api/Api";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { SetRules } from "./protocol/SetRules";
import { Protocol } from "./protocol/Protocol";
import { WiseOperation } from "./protocol/WiseOperation";
import { ProggressCallback, Callback, Wise } from "./wise";
import { Promise } from "bluebird";
import { Util } from "./util/util";
import { RulePrototyper } from "./rules/RulePrototyper";
import { Ruleset } from "./protocol/Ruleset";
import { EffectuatedSetRules } from "./protocol/EffectuatedSetRules";
import { SetRulesForVoter } from "./protocol/SetRulesForVoter";

export class RulesUpdater {
    public static uploadRulesetsForVoter(
        api: Api, protocol: Protocol, delegator: string, voter: string, rulesets: Ruleset [],
        proggressCallback?: ProggressCallback
    ): Promise<SteemOperationNumber> {

        return Promise.resolve()
        .then(() => { // remember that validation error throwing must occur in the promise. Not in the code of method.
            // If it happens outside the promise, catching it requires try...catch additional to Promise.catch
            // validate input params
            if (!voter || !voter.length)
                throw new Error("Wise#uploadRulesetsForVoter: voter cannot be undefined or empty");
            if (!rulesets)
                throw new Error("Wise#uploadRulesetsForVoter: rulesets cannot be undefined");
            if (!Array.isArray(rulesets))
                throw new Error("Wise#uploadRulesetsForVoter: rulesets must be an array");
            if (rulesets.filter(ruleset => !Ruleset.validateRuleset(ruleset)).length > 0)
                throw new Error("Wise#uploadRulesetsForVoter: rulesets must contain valid rulesets. Invalid rulesets: "
                + JSON.stringify(rulesets.filter(ruleset => !Ruleset.validateRuleset(ruleset))));

            // the following method will throw error on invalid rule object
            const validatedAndPrototypedRulesets = rulesets.map(ruleset => RulePrototyper.prototypeRuleset(ruleset));
            return validatedAndPrototypedRulesets;
        })
        .then(rulesets => { // serialize object to blockchain
            const setRulesCmd: SetRules = {
                rulesets: rulesets
            };
            const wiseOp: WiseOperation = {
                voter: voter,
                delegator: delegator,
                command: setRulesCmd
            };

            const steemOps: [string, object][] = protocol.serializeToBlockchain(wiseOp);
            if (steemOps.length !== 1) throw new Error("SetRules should be a single blockchain operation");
            else return steemOps;
        })
        .then((steemOps: [string, object][]) => { // validate operation object
            if (protocol.validateOperation(steemOps[0])) return (steemOps);
            else throw new Error("Operation object has invalid structure");
        })
        .then((steemOps: [string, object][]) => {
            if (proggressCallback) proggressCallback("Sending rules to blockchain...", 0.0);
            return api.sendToBlockchain(steemOps);
        })
        .then(resultSon => { if (proggressCallback) proggressCallback("Sent to blockchain (" + resultSon.toString()
             + ")", 1.0); return resultSon; });
    }

    public static downloadAllRulesets(api: Api, protocol: Protocol, delegator: string, moment: SteemOperationNumber = SteemOperationNumber.FUTURE): Promise<EffectuatedSetRules []> {
        return api.loadAllRulesets(delegator, moment, protocol)
        .then((currentRules: EffectuatedSetRules []) => {
            if (currentRules.length == 0) return [];

            const rulesByVoter: [string, EffectuatedSetRules []][] = _.toPairs(_.groupBy(currentRules, (r: EffectuatedSetRules) => r.voter));

            return rulesByVoter.map((votersRuleHistory: [string, EffectuatedSetRules []]) => {
                return votersRuleHistory[1].reduce((newestRules: EffectuatedSetRules, testedRules: EffectuatedSetRules) => {
                    if (testedRules.moment.isGreaterThan(newestRules.moment)) return testedRules;
                    else return newestRules;
                }, votersRuleHistory[1][0]);
            });
        })
        .then((rules: EffectuatedSetRules []) => { // remove voters with cleared (empty) rules
            return _.filter(rules, rulesForSingleVoter => rulesForSingleVoter.rulesets.length > 0);
        });
    }

    public static uploadAllRulesets(api: Api, protocol: Protocol, delegator: string,
            newRules: SetRulesForVoter [], proggressCallback: ProggressCallback
    ): Promise<SteemOperationNumber | true> {
        return Promise.resolve()
        .then(() => { // validate input rules
            const invalidRulesetsForVoter = newRules.filter(r => !SetRulesForVoter.validateSetRulesForVoter(r));
            if (invalidRulesetsForVoter.length > 0)
                throw new Error("There are invalid rulesets: " + invalidRulesetsForVoter); // can throw inside promise

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
        })
        .then(() => RulesUpdater.downloadAllRulesets(api, protocol, delegator))
        .then((currentRules: EffectuatedSetRules []) => { // decide what operations are needed to be sent
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
            });

            return operationsToPerform;
        })
        .then((operationsToPerform: WiseOperation []): Promise<SteemOperationNumber | true> => {
            if (operationsToPerform.length === 0) return Promise.resolve(true) as Promise<SteemOperationNumber | true>;
            else {
                proggressCallback("Updating rules: " + operationsToPerform.length + " operations to send...", 0);
                return Promise.resolve(operationsToPerform).mapSeries((op_: any /* bug in Bluebird */, index) => {
                    const op = op_ as WiseOperation;
                    const num = index + 1;
                    proggressCallback("Updating rules: Sending operation " + num + "/" + operationsToPerform.length + "...", (num / operationsToPerform.length));
                    return api.sendToBlockchain(protocol.serializeToBlockchain(op))
                    .then(moment => {
                        proggressCallback("Updating rules: Sent operation " + num + "/" + operationsToPerform.length
                            + " (" + moment + ")", ((num + 1) / operationsToPerform.length));
                        return moment;
                    });
                })
                .then((moments: SteemOperationNumber []): SteemOperationNumber => {
                    proggressCallback("Done updating rules.", 1);
                    return Util.definedOrThrow(_.last(moments));
                });
            }
        });
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
