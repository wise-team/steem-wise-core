import { Promise } from "bluebird";
import * as steem from "steem";

import { SteemPost } from "../../blockchain/SteemPost";
import { SetRules } from "../../protocol/SetRules";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";
import { ChainableSupplier, ChainableFilter, ChainableTransformer, SimpleTaker } from "../../chainable/Chainable";
import { SteemOperation } from "../../blockchain/SteemOperation";
import { Api } from "../Api";
import { Protocol } from "../../protocol/Protocol";
import { CustomJsonOperation } from "../../blockchain/CustomJsonOperation";
import { V1Handler } from "../../protocol/versions/v1/V1Handler";
import { RawOperation } from "./RawOperation";
import { SteemJsAccountHistorySupplier } from "./SteemJsAccountHistorySupplier";
import { SmartvotesOperationTypeFilter } from "../../chainable/filters/SmartvotesOperationTypeFilter";
import { EffectuatedSmartvotesOperation } from "../../protocol/EffectuatedSmartvotesOperation";
import { OperationNumberFilter } from "../../chainable/filters/OperationNumberFilter";
import { ToSmartvotesOperationTransformer } from "../../chainable/transformers/ToSmartvotesOperationTransformer";
import { ChainableLimiter } from "../../chainable/limiters/ChainableLimiter";
import { VoterFilter } from "./VoterFilter";

export class DirectBlockchainApi extends Api {
    private steem: any;
    private username: string;
    private postingWif: string;

    public constructor(username: string, postingWif: string, steemOptions?: object) {
        super();

        this.steem = steem;
        this.username = username;
        this.postingWif = postingWif;

        if (steemOptions) this.steem.api.setOptions(steemOptions);
    }

    public name(): string {
        return "DirectBlockchainApi";
    }

    public loadPost(author: string, permlink: string): Promise<SteemPost> {
        return new Promise((resolve, reject) => {
            this.steem.api.getContent(author, permlink, function(error: Error, result: any) {
                if (error) reject(error);
                else if (result.id == 0) reject(new Error("This post does not exist"));
                else resolve(result as SteemPost);
            });
        });
    }

    public loadRulesets(delegator: string, voter: string, atMoment: SteemOperationNumber, protocol: Protocol): Promise<SetRules> {
        return new Promise((resolve, reject) => {
            if (typeof delegator === "undefined" || delegator.length == 0) throw new Error("Delegator must not be empty");
            if (typeof voter === "undefined" || voter.length == 0) throw new Error("Delegator must not be empty");

            const loadedRulesets: SetRules [] = [];

            let noResult: boolean = true;
            new SteemJsAccountHistorySupplier(this.steem, delegator)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", atMoment))
                .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of smartvotes presence)
                .chain(new ToSmartvotesOperationTransformer(protocol))
                .chain(new VoterFilter(voter))
                .chain(new SmartvotesOperationTypeFilter<EffectuatedSmartvotesOperation>(SmartvotesOperationTypeFilter.OperationType.SetRules))
                .chain(new ChainableLimiter(1))
                .chain(new SimpleTaker((item: EffectuatedSmartvotesOperation): boolean => {
                    noResult = false;
                    resolve(item.command as SetRules);
                    return false;
                }))
                .catch((error: Error) => {
                    noResult = false;
                    reject(error);
                    return false;
                });
            })
            .start(() => {
                if (noResult) resolve({rulesets: []} as SetRules);
            });
        });
    }

    public streamSince(moment: SteemOperationNumber): ChainableSupplier<SteemOperation, any> {
        throw new Error("Not implemented yet");
    }

    public sendToBlockchain(operations: [string, object][]): Promise<SteemOperationNumber> {
        return new Promise<SteemOperationNumber>((resolve, reject) => {
            const steemCallback = function(error: Error | undefined, result: { id: string, block_num: number, trx_num: number }): void {
                if (error) reject(error);
                else {
                    resolve(new SteemOperationNumber(result.block_num, result.trx_num, operations.length - 1));
                }
            };

            steem.broadcast.send(
                {
                    extensions: [],
                    operations: operations
                },
                {posting: this.postingWif},
                steemCallback
            );
        });
    }
}








