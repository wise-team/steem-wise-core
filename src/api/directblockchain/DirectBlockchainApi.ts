/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as steem from "steem";
import * as _ from "lodash";

import { SetRules } from "../../protocol/SetRules";
import { EffectuatedSetRules } from "../../protocol/EffectuatedSetRules";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { SimpleTaker, Chainable } from "../../chainable/Chainable";
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
import { Log } from "../../log/Log";
import { UnifiedSteemTransaction } from "../../blockchain/UnifiedSteemTransaction";
import Wise from "../../wise";

export class DirectBlockchainApi extends Api {
    private static DEFAULT_STEEM_API_ENDPOINT_URL = /*§ §*/ "https://anyx.io" /*§ ' "' + data.config.steem.defaultApiUrl + '" ' §.*/;
    private steem: steem.api.Steem;
    private postingWif: string | undefined;
    private sendEnabled: boolean = true;
    private protocol: Protocol;

    public constructor(protocol: Protocol, postingWif?: string, steemOptions?: steem.SteemJsOptions) {
        super();

        this.protocol = protocol;
        if (postingWif) this.postingWif = postingWif;

        if (steemOptions) {
            this.steem = new steem.api.Steem(steemOptions);
        }
        else this.steem = new steem.api.Steem({
            url: DirectBlockchainApi.DEFAULT_STEEM_API_ENDPOINT_URL,
            logger: (...args: any []) => {
                Log.log().efficient(Log.level.silly, () => JSON.stringify(args));
            }
        });
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
        forWhom: { delegator?: string, voter?: string }, atMoment: SteemOperationNumber
    ): Promise<EffectuatedSetRules []> {
        Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_API_LOAD_RULESETS="
            + JSON.stringify({ forWhom: forWhom, atMoment: atMoment }));

        if (!forWhom.delegator)
            throw new Error("Direct blockchain api can only load rulesets for one voter."
                + " Use other api to load rulesets from many delegators");


        const loadedRulesets: EffectuatedSetRules [] = [];
        const supplier = new SteemJsAccountHistorySupplier(this.steem, forWhom.delegator)
            .branch((historySupplier) => {
                let chain: Chainable<any, any, any> = historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                // this is limiter (restricts lookup to the period of wise presence):
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter())
                .chain(new ToWiseOperationTransformer(this.protocol));

                if (forWhom.voter) chain = chain.chain(new VoterFilter(forWhom.voter));

                chain = chain.chain(new WiseOperationTypeFilter<EffectuatedWiseOperation>(
                    WiseOperationTypeFilter.OperationType.SetRules)
                );

                if (forWhom.voter) chain = chain.chain(new ChainableLimiter(1));

                chain.chain(new SimpleTaker((item: EffectuatedWiseOperation): boolean => {
                    const setRules = item.command as SetRules;
                    const esr: EffectuatedSetRules = {
                        rulesets: setRules.rulesets,
                        voter: item.voter,
                        delegator: item.delegator,
                        moment: item.moment
                    };
                    loadedRulesets.push(esr);
                    return true;
                }))
                .catch((error: Error) => false); // if we return false on error, the Promise will be rejected
            }
        );

        await supplier.start();

        const allRulesGrouppedByVoter: { [voter: string]: EffectuatedSetRules [] } = _.groupBy(loadedRulesets, "voter");

        const out: EffectuatedSetRules [] = [];
        _.forOwn(allRulesGrouppedByVoter, (esr: EffectuatedSetRules [], voter: string) => {
            out.push(esr.sort((a, b) => SteemOperationNumber.compare(a.moment, b.moment)).reverse()[0]);
        });
        return out;
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

    public async getLastConfirmationMoment(delegator: string): Promise<SteemOperationNumber> {
        Log.log().cheapDebug(() => "DIRECT_BLOCKCHAIN_API_GET_LAST_CONFIRMATION_MOMENT=" + JSON.stringify({ delegator: delegator }));

        if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");

        let result: SteemOperationNumber = V1Handler.INTRODUCTION_OF_WISE_MOMENT;

        const supplier = new SteemJsAccountHistorySupplier(this.steem, delegator)
        .branch((historySupplier) => {
            historySupplier
            .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
            .chain(new ToWiseOperationTransformer(this.protocol))
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

    public async getWiseOperations(account: string, until: Date): Promise<EffectuatedWiseOperation []> {
        if (typeof account === "undefined" || account.length == 0) throw new Error("Username must not be empty");

        const result: EffectuatedWiseOperation [] = [];

        const supplier = new SteemJsAccountHistorySupplier(this.steem, account)
        .branch((historySupplier) => {
            historySupplier
            .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
            .chain(new DateLimiter(until))
            .chain(new ToWiseOperationTransformer(this.protocol))
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

    public async getWiseOperationsRelatedToDelegatorInBlock(
            delegator: string, blockNum: number, skipDelegatorCheck: boolean = false,
            delayOnNoBlockMs: number = /*§ data.config.steem.waitForNextHeadBlockDelayMs §*/3100/*§ §.*/
        ): Promise<EffectuatedWiseOperation []> {
        const block: steem.GetBlock.Block = await this.steem.getBlockAsync(blockNum);

        if (!block) {
            await BluebirdPromise.delay(delayOnNoBlockMs);
            return await this.getWiseOperationsRelatedToDelegatorInBlock(delegator, blockNum, skipDelegatorCheck);
        }
        else {
            return await this.getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator, blockNum, block, skipDelegatorCheck);
        }
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processBlock(delegator: string, blockNum: number, block: steem.GetBlock.Block, skipDelegatorCheck: boolean): EffectuatedWiseOperation [] {
        let out: EffectuatedWiseOperation [] = [];

        const block_num = blockNum;
        const timestampUtc = block.timestamp;
        for (let transaction_num = 0; transaction_num < block.transactions.length; transaction_num++) {
            const transaction = block.transactions[transaction_num];

            out = out.concat(this.getWiseOperationsRelatedToDelegatorInBlock_processTransaction(
                delegator, blockNum, transaction_num, transaction,
                new Date(timestampUtc + "Z" /* this is UTC date */), skipDelegatorCheck
            ));
        }

        return out;
    }

    private getWiseOperationsRelatedToDelegatorInBlock_processTransaction(
        delegator: string, blockNum: number, transactionNum: number, transaction: steem.GetBlock.Transaction,
        timestamp: Date, skipDelegatorCheck: boolean
    ): EffectuatedWiseOperation [] {
        const out: EffectuatedWiseOperation [] = [];
        const steemTx: UnifiedSteemTransaction = {
            block_num: blockNum,
            transaction_num: transactionNum,
            transaction_id: transaction.transaction_id,
            timestamp: timestamp,
            ops: transaction.operations
        };
        const handleResult = this.protocol.handleOrReject(steemTx);

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
    public async getAllWiseOperationsInBlock(blockNum: number): Promise<EffectuatedWiseOperation []> {
        return await this.getWiseOperationsRelatedToDelegatorInBlock("", blockNum, true /* skip delegator check */);
    }

    public async getDynamicGlobalProperties(): Promise<steem.DynamicGlobalProperties> {
        return await this.steem.getDynamicGlobalPropertiesAsync();
    }

    public async getAccountInfo(username: string): Promise<steem.AccountInfo> {
        const result: steem.AccountInfo [] = await this.steem.getAccountsAsync([username]);
        if (result.length > 0) {
            return result[0];
        }
        else throw new NotFoundException("Account " + username + " does not exist");
    }

    public async getBlogEntries(username: string, startFrom: number, limit: number): Promise<steem.BlogEntry []> {
        return await this.steem.getBlogEntriesAsync(username, startFrom, limit);
    }
}
