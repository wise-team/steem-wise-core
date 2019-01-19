import * as steem from "steem";
import ow from "ow";
import { SteemAdapter } from "./SteemAdapter";
import { BlockchainConfig } from "./BlockchainConfig";

export class SteemAdapterImpl implements SteemAdapter {
    private options: SteemAdapter.Options;
    private steem: steem.api.Steem;

    public constructor(options: SteemAdapter.Options) {
        SteemAdapter.Options.validate(options);
        this.options = options;

        this.steem = this.constructSteem();
    }

    public async getAccountHistoryAsync(
        username: string,
        from: number,
        limit: number
    ): Promise<steem.AccountHistory.Operation[]> {
        ow(username, "username", ow.string.nonEmpty);
        ow(from, "from", ow.number.greaterThanOrEqual(-1));
        ow(limit, "limit", ow.number.inRange(1, BlockchainConfig.ACCOUNT_HISTORY_MAX_BATCH_SIZE));

        try {
            return await this.steem.getAccountHistoryAsync(username, from, limit);
        } catch (error) {
            throw new SteemAdapter.SteemError("in getAccountHistoryAsync: " + error, error);
        }
    }

    private constructSteem(): steem.api.Steem {
        return new steem.api.Steem({
            url: this.options.url,
        });
    }
}
