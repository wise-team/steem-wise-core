/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as steem from "steem";
import * as _ from "lodash";

import { SetRules } from "../../protocol/SetRules";
import { EffectuatedSetRules } from "../../protocol/EffectuatedSetRules";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { SimpleTaker } from "../../chainable/Chainable";
import { Api } from "../Api";
import { Protocol } from "../../protocol/Protocol";
import { V1Handler } from "../../protocol/versions/v1/V1Handler";
import { SteemJsAccountHistorySupplier } from "./SteemJsAccountHistorySupplier";
import { WiseOperationTypeFilter } from "../../chainable/filters/WiseOperationTypeFilter";
import { EffectuatedWiseOperation } from "../../protocol/EffectuatedWiseOperation";
import { OperationNumberFilter } from "../../chainable/filters/OperationNumberFilter";
import { ToWiseOperationTransformer } from "../../chainable/transformers/ToWiseOperationTransformer";
import { ChainableLimiter } from "../../chainable/limiters/ChainableLimiter";
import { VoterFilter } from "./VoterFilter";
import { NotFoundException } from "../../util/NotFoundException";
import { DateLimiter } from "./DateLimiter";
import { Log } from "../../util/log";
import { UnifiedSteemTransaction } from "../../blockchain/UnifiedSteemTransaction";

export class DirectBlockchainApi extends Api {
    private steem: steem.api.Steem;
    private steemOptions?: steem.SteemJsOptions;
    private postingWif: string | undefined;
    private sendEnabled: boolean = true;

    public constructor(postingWif?: string, steemOptions?: steem.SteemJsOptions) {
        super();

        this.steem = new steem.api.Steem(steemOptions || {});
        this.postingWif = postingWif;

        if (steemOptions) {
            this.steemOptions = steemOptions;
        }
    }

    public name(): string {
        return "DirectBlockchainApi";
    }

    public setSendEnabled(enabled: boolean) {
        Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_SET_SEND_ENABLED=" + enabled);

        this.sendEnabled = enabled;
    }

    public async loadPost(author: string, permlink: string): Promise<steem.SteemPost> {
        Log.log().cheapDebug(
            () => "DIRECT_BLOCKCHAIN_API_LOAD_POST=" + JSON.stringify({ author: author, permlink: permlink })
        );

        const result: any = await this.steem.getContentAsync(author, permlink);
        if (result.author.length === 0)
                throw new NotFoundException("The post (@" + author + "/" + permlink + ") does not exist");
        return result as steem.SteemPost;
    }

    public async loadRulesets(
        delegator: string, voter: string, atMoment: SteemOperationNumber, protocol: Protocol
    ): Promise<SetRules> {
        Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_RULESETS="
            + JSON.stringify({ delegator: delegator, voter: voter, atMoment: atMoment }));

        if (typeof delegator === "undefined" || delegator.length == 0)
            throw new Error("Delegator must not be empty");
        if (typeof voter === "undefined" || voter.length == 0)
            throw new Error("Voter must not be empty");

        const loadedRulesets: SetRules [] = [];
        const supplier = new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                // this is limiter (restricts lookup to the period of wise presence):
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter())
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new VoterFilter(voter))
                .chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(
                    WiseOperationTypeFilter.OperationType.SetRules)
                )
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    loadedRulesets.push(item.command as SetRules);
                    return false;
                }))
                .catch((error: Error) => false); // if we return false on error, the Promise will be rejected
            }
        );

        await supplier.start();

        if (loadedRulesets.length > 0) return loadedRulesets[0];
        else {
            const emptyResult: SetRules = { rulesets: [] };
            return emptyResult;
        }
    }

    public async sendToBlockchain(operations: steem.OperationWithDescriptor[]): Promise<SteemOperationNumber> {
        if (!this.sendEnabled) {
            Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_DISABLED=" + JSON.stringify(operations));
            return SteemOperationNumber.NEVER;
        }

        Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_API_SEND_TO_BLOCKCHAIN_PENDING=" + JSON.stringify(operations));
        const result: { id: string, block_num: number, trx_num: number }
        = await steem.broadcast.sendAsync(
            { extensions: [], operations: operations },
            { posting: this.postingWif },
        );

        return new SteemOperationNumber(result.block_num, result.trx_num, operations.length - 1);
    }

    public async loadAllRulesets(delegator: string, atMoment: SteemOperationNumber, protocol: Protocol): Promise<EffectuatedSetRules []> {
        Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_ALL_RULESETS=" + JSON.stringify({ delegator: delegator, atMoment: atMoment }));

        if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

        const allRules: EffectuatedSetRules [] = [];

        const supplier = new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
                .chain(new ToWiseOperationTransformer(protocol))
                .chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(WiseOperationTypeFilter.OperationType.SetRules))
                .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    const out: EffectuatedSetRules = {
                        rulesets: (item.command as SetRules).rulesets,
                        moment: item.moment,
                        voter: item.voter
                    };
                    allRules.push(out);

                    return true;
                }))
                .catch((error: Error) => false); // if we do not continue on error the promise will be rejected with this error
            }
        );
        await supplier.start();

        const allRulesGrouppedByVoter: { [voter: string]: EffectuatedSetRules [] } = _.groupBy(allRules, "voter");

        const out: EffectuatedSetRules [] = [];
        _.forOwn(allRulesGrouppedByVoter, (esr: EffectuatedSetRules [], voter: string) => {
            out.push(esr.sort((a, b) => SteemOperationNumber.compare(a.moment, b.moment)).reverse()[0]);
        });
        return out;
    }

    public async getLastConfirmationMoment(delegator: string, protocol: Protocol): Promise<SteemOperationNumber> {
        Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT=" + JSON.stringify({ delegator: delegator }));

        if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

        let result: SteemOperationNumber = V1Handler.INTRODUCTION_OF_WISE_MOMENT;

        const supplier = new SteemJsAccountHistorySupplier(this.steem, delegator)
        .branch((historySupplier) => {
            historySupplier
            .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
            .chain(new ToWiseOperationTransformer(protocol))
            .chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(WiseOperationTypeFilter.OperationType.ConfirmVote))
            .chain(new ChainableLimiter(1))
            .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                result = item.moment;
                return false;
            }))
            .catch((error: Error) => false); // if we do not continue on error the promise will be rejected with this error
        }
        );
        await supplier.start();
        return result;
    }

    public async getWiseOperations(account: string, until: Date, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        if (typeof account === "undefined" || account.length == 0) throw new Error("Username must not be empty");

        const result: EffectuatedWiseOperation [] = [];

        const supplier = new SteemJsAccountHistorySupplier(this.steem, account)
        .branch((historySupplier) => {
            historySupplier
            .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
            .chain(new DateLimiter(until))
            .chain(new ToWiseOperationTransformer(protocol))
            .chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                result.push(item);
                return true;
            }))
            .catch((error: Error) => false); // if we do not continue on error the promise will be rejected with this error
        }
        );
        await supplier.start();

        return result;
    }

    public async getWiseOperationsRelatedToDelegatorInBlock(delegator: string, blockNum: number, protocol: Protocol, skipDelegatorCheck: boolean = false): Promise<EffectuatedWiseOperation []> {
        const block: steem.GetBlock.Block = await this.steem.getBlockAsync(blockNum);

        if (!block) {
            return BluebirdPromise.delay(1500)
            .then(() => this.getWiseOperationsRelatedToDelegatorInBlock(delegator, blockNum, protocol, skipDelegatorCheck));
        }
        else {
            return this.getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator, blockNum, block, protocol, skipDelegatorCheck);
        }
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator: string, blockNum: number, block: steem.GetBlock.Block, protocol: Protocol, skipDelegatorCheck: boolean): EffectuatedWiseOperation [] {
        let out: EffectuatedWiseOperation [] = [];

        const block_num = blockNum;
        const timestampUtc = block.timestamp;
        for (let transaction_num = 0; transaction_num < block.transactions.length; transaction_num++) {
            const transaction = block.transactions[transaction_num];

            out = out.concat(this.getWiseOperationsRelatedToDelegatorInBlock_processTransaction(
                delegator, blockNum, transaction_num, transaction,
                new Date(timestampUtc + "Z" /* this is UTC date */), protocol, skipDelegatorCheck
            ));
        }

        return out;
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processTransaction(
        delegator: string, blockNum: number, transactionNum: number, transaction: steem.GetBlock.Transaction,
        timestamp: Date, protocol: Protocol, skipDelegatorCheck: boolean
    ): EffectuatedWiseOperation [] {
        const out: EffectuatedWiseOperation [] = [];
        const steemTx: UnifiedSteemTransaction = {
            block_num: blockNum,
            transaction_num: transactionNum,
            transaction_id: transaction.transaction_id,
            timestamp: timestamp,
            ops: transaction.operations
        };
        const handleResult = protocol.handleOrReject(steemTx);

        if (handleResult) {
            handleResult.forEach(wiseOp => {
                if (skipDelegatorCheck || wiseOp.delegator === delegator) out.push(wiseOp);
            });
        }

        return out;
    }

    /**
     * This function is specific only to DirectBlockchainApi. It returns all wise operations in block
     * (without checking delegator).
     * @param blockNum - number of the block.
     * @param protocol - Protocol object.
     */
    public getAllWiseOperationsInBlock(blockNum: number, protocol: Protocol): Promise<EffectuatedWiseOperation []> {
        return this.getWiseOperationsRelatedToDelegatorInBlock("", blockNum, protocol, true /* skip delegator check */);
    }

    public async getDynamicGlobalProperties(): Promise<steem.DynamicGlobalProperties> {
        return this.steem.getDynamicGlobalPropertiesAsync();
    }

    public async getAccountInfo(username: string): Promise<steem.AccountInfo> {
        const result: steem.AccountInfo [] = await this.steem.getAccountsAsync([username]);
        if (result.length > 0) {
            return result[0];
        }
        else throw new NotFoundException("Account " + username + " does not exist");
    }

    public getBlogEntries(username: string, startFrom: number, limit: number): Promise<steem.BlogEntry []> {
        return this.steem.getBlogEntriesAsync(username, startFrom, limit);
    }
}
