import * as steem from "steem";
import { SteemAdapter } from "./SteemAdapter";

export class SteemAdapterMock implements SteemAdapter {
    public async getAccountHistoryAsync(
        username: string,
        from: number,
        limit: number
    ): Promise<steem.AccountHistory.Operation[]> {
        throw new Error("Method not mocked");
    }
}
