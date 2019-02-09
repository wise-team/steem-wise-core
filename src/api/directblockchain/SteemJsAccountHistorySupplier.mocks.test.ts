import * as steem from "steem";
import * as _ from "lodash";
import * as uuid from "uuid/v4";
import * as sinon from "sinon";

import { SteemJsAccountHistorySupplier } from "./SteemJsAccountHistorySupplier";
import { SteemAdapter, SteemAdapterFactory, UnifiedSteemTransaction, SimpleTaker } from "steem-efficient-stream";

export type FakeAccountHistoryOpsGenerator = (username: string, length: number) => steem.AccountHistory.Operation[];

export function generateFakeAccountHistoryOps(username: string, length: number): steem.AccountHistory.Operation[] {
    const ops = _.range(0, length).map(index => {
        const op: steem.VoteOperationWithDescriptor = [
            "vote",
            {
                voter: username,
                author: "author-" + index,
                permlink: "permlink-" + index,
                weight: -10000 + 20000 * Math.random(),
            },
        ];
        const accHistop: steem.AccountHistory.Operation = [
            index,
            {
                block: Math.floor(index / 2),
                op: op,
                op_in_trx: 0,
                timestamp: new Date(Date.now() - 10000 + index).toISOString(),
                trx_id: uuid() + "_trx_" + index,
                trx_in_block: index % 2,
                virtual_op: 0,
            },
        ];
        return accHistop;
    });
    return ops;
}

export function getAccountHistoryAsyncMock(fakeAccountHistoryOps: steem.AccountHistory.Operation[]) {
    const mockedFn: (
        username: string,
        from: number,
        limit: number
    ) => Promise<steem.AccountHistory.Operation[]> = async (username: string, from: number, limit: number) => {
        if (from < 0) from = fakeAccountHistoryOps.length - 1;
        const sliceStart = Math.max(from - limit, 0);
        const sliceEndExcluding = sliceStart + limit + 1;
        const result = fakeAccountHistoryOps.slice(sliceStart, sliceEndExcluding);
        // console.log({ sliceStart, sliceEndExcluding, result, fakeAccountHistoryOps });
        return result;
    };
    return mockedFn;
}

export function prepare(params: { accountHistoryLength: number; batchSize: number, customOpsGenerator?: FakeAccountHistoryOpsGenerator }) {
    const username = _.sample(["noisy", "jblew", "fervi"]) || "-sample-returned-undefined-";
    const adapter: SteemAdapter = SteemAdapterFactory.mock();

    const opsGenerator: FakeAccountHistoryOpsGenerator = params.customOpsGenerator || generateFakeAccountHistoryOps;
    const fakeAccountHistoryOps = opsGenerator(username, params.accountHistoryLength);

    const getAccountHistoryAsyncSpy = sinon.spy(getAccountHistoryAsyncMock(fakeAccountHistoryOps));
    adapter.getAccountHistoryAsync = getAccountHistoryAsyncSpy;
    const supplier = new SteemJsAccountHistorySupplier(adapter, username, params.batchSize);

    return { username, adapter, fakeAccountHistoryOps, getAccountHistoryAsyncSpy, supplier, params };
}

export async function takeTransactionsFromSupplier(
    supplier: SteemJsAccountHistorySupplier,
    takeCount: number = -1
): Promise<UnifiedSteemTransaction[]> {
    const takenTransactions: UnifiedSteemTransaction[] = [];
    supplier.chain(
        new SimpleTaker<UnifiedSteemTransaction>(trx => {
            takenTransactions.push(trx);
            const takeNext = takeCount > 0 ? takenTransactions.length < takeCount : true;
            const takenTransactionsLength = takenTransactions.length;
            // console.log("take(): ", { takeCount, takenTransactionsLength, takeNext });
            return takeNext;
        })
    );
    await supplier.start();
    return takenTransactions;
}