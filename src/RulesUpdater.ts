import * as _ from "lodash";

import { Api } from "./api/Api";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { SetRules, EffectuatedSetRules, SetRulesForVoter } from "./protocol/SetRules";
import { Protocol } from "./protocol/Protocol";
import { SmartvotesOperation } from "./protocol/SmartvotesOperation";
import { ProggressCallback } from "./ProggressCallback";
import { Promise } from "bluebird";
import { Util } from "./util/util";
import { RulePrototyper } from "./rules/RulePrototyper";

export class RulesUpdater {
    public static updateRulesIfChanged(api: Api, protocol: Protocol, delegator: string,
            newRules: SetRulesForVoter [], proggressCallback: ProggressCallback): Promise<SteemOperationNumber | true> {
        return api.loadAllRulesets(delegator, SteemOperationNumber.FUTURE, protocol)
        .then((currentRules: EffectuatedSetRules []) => { // remove rules that were overwritten
            if (currentRules.length == 0) return [];

            const rulesByVoter: [string, EffectuatedSetRules []][] = _.toPairs(_.groupBy(currentRules, (r: EffectuatedSetRules) => r.voter));

            return rulesByVoter.map((votersRuleHistory: [string, EffectuatedSetRules []]) => {
                return votersRuleHistory[1].reduce((newestRules: EffectuatedSetRules, testedRules: EffectuatedSetRules) => {
                    if (testedRules.moment.isGreaterThan(newestRules.moment)) return testedRules;
                    else return newestRules;
                }, votersRuleHistory[1][0]);
            });
        })
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

            const operationsToPerform: SmartvotesOperation [] = [];
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
        .then((operationsToPerform: SmartvotesOperation []): Promise<SteemOperationNumber | true> => {
            if (operationsToPerform.length === 0) return Promise.resolve(true) as Promise<SteemOperationNumber | true>;
            else {
                proggressCallback("Updating rules: " + operationsToPerform.length + " operations to send...", 0);
                return Promise.resolve(operationsToPerform).mapSeries((op_: any /* bug in Bluebird */, index) => {
                    const op = op_ as SmartvotesOperation;
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

    public static sendRules(voter: string, delegator: string, rulesCmd: SetRules): SmartvotesOperation {
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
