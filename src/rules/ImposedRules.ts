/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */

import { Rule } from "./Rule";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { ValidationContext } from "../validation/ValidationContext";
import { DynamicGlobalProperties } from "../blockchain/DynamicGlobalProperties";
import { AccountInfo } from "../blockchain/AccountInfo";
import { ValidationException } from "../validation/ValidationException";
import { BlockchainConfig } from "../blockchain/BlockchainConfig";

export class ImposedRules {
    public static getImposedRules(delegator: string, voter: string): Rule [] {
        return [
            // new ImposedRules.NoDustRule(voter),
            // new ImposedRules.NoDustRule(delegator)
        ];
    }
}

export namespace ImposedRules {
    export class NoDustRule extends Rule {
        private voter: string;

        public constructor(voter: string) {
            super();

            this.voter = voter;
        }

        public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
            return context.getDynamicGlobalProperties()
            .then((dynamicGlobalProperties: DynamicGlobalProperties): Promise<{dynamicGlobalProperties: DynamicGlobalProperties, accountInfo: AccountInfo}> => {
                return new BluebirdPromise((resolve, reject) => {
                    return context.getAccountInfo(this.voter)
                    .then((accountInfo: AccountInfo) => resolve({dynamicGlobalProperties: dynamicGlobalProperties, accountInfo: accountInfo}))
                    .catch((error: Error) => reject(error));
                });
            })
            .then((input: {dynamicGlobalProperties: DynamicGlobalProperties, accountInfo: AccountInfo}): void => {
                const accountInfo = input.accountInfo;
                const dynamicGlobalProperties = input.dynamicGlobalProperties;

                const last_vote_time_s = new Date(accountInfo.last_vote_time + "Z").getTime() / 1000;
                const head_block_time_s = new Date(dynamicGlobalProperties.time + "Z").getTime() / 1000;
                const votes_per_regeneration_period = dynamicGlobalProperties.vote_power_reserve_rate;
                const voter_effective_vesting_shares = this.vestsToFloat(accountInfo.vesting_shares)
                        - this.vestsToFloat(accountInfo.delegated_vesting_shares)
                        + this.vestsToFloat(accountInfo.received_vesting_shares);

                const elapsed_seconds = (head_block_time_s - last_vote_time_s);

                const regenerated_power = (BlockchainConfig.STEEM_100_PERCENT * elapsed_seconds) / BlockchainConfig.STEEM_VOTING_MANA_REGENERATION_SECONDS;
                const current_power = Math.min(accountInfo.voting_power + regenerated_power, BlockchainConfig.STEEM_100_PERCENT);
                if (current_power <= 0) throw new ValidationException("Account " + this.voter + " currently does not have voting power.");

                const abs_weight = Math.abs( voteorder.weight );

                let used_power = ((current_power * abs_weight) / BlockchainConfig.STEEM_100_PERCENT) * (60 * 60 * 24);

                const max_vote_denom = votes_per_regeneration_period * BlockchainConfig.STEEM_VOTING_MANA_REGENERATION_SECONDS;
                if (max_vote_denom <= 0) throw new ValidationException("Account " + this.voter + ": max_vote_denom = " + max_vote_denom);

                used_power = (used_power + max_vote_denom - 1) / max_vote_denom;
                if (max_vote_denom <= 0) throw new ValidationException("Account " + this.voter + " does not have enough power to vote.");

                let abs_rshares    = (voter_effective_vesting_shares * used_power) / (BlockchainConfig.STEEM_100_PERCENT);

                abs_rshares -= BlockchainConfig.STEEM_VOTE_DUST_THRESHOLD;
                abs_rshares = Math.max(0, abs_rshares);
                if (abs_rshares <= BlockchainConfig.STEEM_VOTE_DUST_THRESHOLD) throw new ValidationException("Account " + this.voter + ": Voting weight is too small, please accumulate more voting power or steem power.");
            });
        }

        public type(): Rule.Type {
            throw new Error("This is and imposed rule. It cannot be added to a SetRules ruleset. It is only intended to be used during a voteorder validation");
        }

        private vestsToFloat(vests: string) {
            const unitIndex = vests.indexOf(" VESTS");
            if (unitIndex === -1) throw new ValidationException("Got vests in bad format");
            else {
                return parseFloat(vests.substring(0, unitIndex));
            }
        }

        public validateRuleObject(unprototypedObj: any) {
            throw new Error("This rule should not be prototyped.");
        }

        public getDescription(): string {
            throw new Error("This is an internal rule");
        }
    }
}