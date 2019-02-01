import axios, { AxiosResponse } from "axios";
import * as url from "url";
import * as steem from "steem";

import { SetRules } from "../../protocol/SetRules";
import { EffectuatedSetRules } from "../../protocol/EffectuatedSetRules";
import { SteemOperationNumber } from "steem-efficient-stream";
import { Api } from "../Api";
import { Protocol } from "../../protocol/Protocol";
import { DirectBlockchainApi } from "../directblockchain/DirectBlockchainApi";
import { EffectuatedWiseOperation } from "../../protocol/EffectuatedWiseOperation";
import { RulePrototyper } from "../../rules/RulePrototyper";
import { ConfirmVote } from "../../protocol/ConfirmVote";
import { WiseSQLProtocol } from "./WiseSQLProtocol";

export class WiseSQLApi extends Api {
    public static REQUIRED_ENDPOINT_API_VERSION: string = "1.0";
    private endpointUrl: string;
    private protocol: Protocol;
    private directBlockchainApi: DirectBlockchainApi | undefined = undefined;

    /**
     * You have to specify at least one direct blockchain api.
     */
    public constructor(endpointUrl: string, protocol: Protocol, directBlockchainApi?: DirectBlockchainApi) {
        super();

        this.endpointUrl = endpointUrl;
        this.protocol = protocol;
        if (directBlockchainApi) this.directBlockchainApi = directBlockchainApi;
    }

    public name(): string {
        return "WiseSQLApi";
    }

    public async loadPost(author: string, permlink: string): Promise<steem.SteemPost> {
        if (!this.directBlockchainApi) throw new Error("To use #loadPost method you have to specify a DirectBlockchainApi in constructor");
        return this.directBlockchainApi.loadPost(author, permlink);
    }

    public async loadRulesets(forWhom: { voter?: string, delegator?: string }, at: SteemOperationNumber): Promise<EffectuatedSetRules []> {
        let ops: EffectuatedWiseOperation [];
        let path: string = "";
        let data: object = {};

        if (forWhom.delegator && forWhom.voter) {
            path = "/rpc/rulesets_by_delegator_for_voter_at_moment";
            data = { delegator: forWhom.delegator, voter: forWhom.voter, moment: this.formatMoment(at) };
        }
        else if (forWhom.delegator && !forWhom.voter) {
            path = "/rpc/rulesets_by_delegator_at_moment";
            data = { delegator: forWhom.delegator, moment: this.formatMoment(at) };
        }
        else if (!forWhom.delegator && forWhom.voter) {
            path = "/rpc/rulesets_by_all_delegators_for_voter_at_moment";
            data = { voter: forWhom.voter, moment: this.formatMoment(at) };
        }
        else throw new Error("You have to specify either a voter, a delegator or both of them.");

        ops = await WiseSQLProtocol.Handler.query(
            { endpointUrl: this.endpointUrl, path: path,
            method: "post", limit: 9999, data: data }
        );

        return ops.map((op: EffectuatedWiseOperation) => {
            const setRules = op.command;
            if (!SetRules.isSetRules(setRules)) throw new Error("Operation is not an instance of SetRules: " + JSON.stringify(op));

            const prototypedRulesets = setRules.rulesets.map(unprototypedRuleset => RulePrototyper.prototypeRuleset(unprototypedRuleset));

            const out: EffectuatedSetRules = {
                moment: op.moment,
                voter: op.voter,
                delegator: op.delegator,
                rulesets: prototypedRulesets
            };
            return out;
        });
    }

    public async sendToBlockchain(operations: steem.OperationWithDescriptor[]): Promise<SteemOperationNumber> {
        if (!this.directBlockchainApi) throw new Error("To use #sendToBlockchain method you have to specify a DirectBlockchainApi in constructor");
        return this.directBlockchainApi.sendToBlockchain(operations);
    }

    public async getLastConfirmationMoment(delegator: string): Promise<SteemOperationNumber> {
        const ops: EffectuatedWiseOperation [] = await WiseSQLProtocol.Handler.query(
            { endpointUrl: this.endpointUrl, path: "/operations", method: "get", limit: 1,
            params: { delegator: "eq." + delegator, operation_type: "eq.confirm_vote", order: "moment.desc" } }
        );

        if (ops.length !== 1) throw new Error("Invalid number of rows returned. This query should return a single row.");
        if (!ConfirmVote.isConfirmVote(ops[0].command))
            throw new Error("Invalid format of response (json_str is not a ConfirmVote operation): "
             + JSON.stringify(ops[0].command));
        return ops[0].moment;
    }

    public async getAllWiseOperationsInBlock(blockNum: number, delegatorFilter?: string): Promise<EffectuatedWiseOperation []> {
        const params: any = { order: "moment.desc", block_num: "eq." + blockNum };
        if (delegatorFilter) params.delegator = "eq." + delegatorFilter;

        const ops: EffectuatedWiseOperation [] = await WiseSQLProtocol.Handler.query({
            endpointUrl: this.endpointUrl, path: "/operations", method: "get", limit: 9999,
            params: params
        });

        return ops.map((op: EffectuatedWiseOperation) => {
            if (SetRules.isSetRules(op.command)) {
                op.command.rulesets = op.command.rulesets.map(ruleset => RulePrototyper.prototypeRuleset(ruleset));
            }
            return op;
        });
    }

    public async getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number): Promise<EffectuatedWiseOperation []> {
        return this.getAllWiseOperationsInBlock(blockNum, delegator);
    }

    public async getWiseOperations(username: string, until: Date): Promise<EffectuatedWiseOperation []> {
        const ops: EffectuatedWiseOperation [] = await WiseSQLProtocol.Handler.query(
            { endpointUrl: this.endpointUrl, path: "/operations", method: "get", limit: 9999,
            params: { order: "moment.desc", or: "(voter.eq." + username + ",delegator.eq." + username + ")", timestamp: "gte." + until.toISOString() } }
        );

        return ops.map((op: EffectuatedWiseOperation) => {
            if (SetRules.isSetRules(op.command)) {
                op.command.rulesets = op.command.rulesets.map(ruleset => RulePrototyper.prototypeRuleset(ruleset));
            }
            return op;
        });
    }

    public async getDynamicGlobalProperties(): Promise<steem.DynamicGlobalProperties> {
        if (!this.directBlockchainApi) throw new Error("To use #getDynamicGlobalProperties method you have to specify a DirectBlockchainApi in constructor");
        return this.directBlockchainApi.getDynamicGlobalProperties();
    }

    public async getAccountInfo(username: string): Promise<steem.AccountInfo> {
        if (!this.directBlockchainApi) throw new Error("To use #getAccountInfo method you have to specify a DirectBlockchainApi in constructor");
        return this.directBlockchainApi.getAccountInfo(username);
    }

    public async getBlogEntries(username: string, startFrom: number, limit: number): Promise<steem.BlogEntry []> {
        if (!this.directBlockchainApi) throw new Error("To use #getBlogEntries method you have to specify a DirectBlockchainApi in constructor");
        return this.directBlockchainApi.getBlogEntries(username, startFrom, limit);
    }

    private formatMoment(moment: SteemOperationNumber): string {
        if (moment.blockNum === SteemOperationNumber.FUTURE.blockNum) {
            return "99999999999999.0000"; // 14 digits
        }
        return moment.blockNum + "."
            + ("000" + moment.transactionNum).slice(-4);
    }
}
