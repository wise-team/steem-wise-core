import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as steem from "steem";
import * as _ from "lodash";

import { prepare, takeTransactionsFromSupplier } from "./SteemJsAccountHistorySupplier.mocks.test";

chaiUse(chaiAsPromised);

describe("SteemJsAccountHistorySupplier", function() {
    it("queries only once if batch returns lower number of operations than limit", async () => {
        const { supplier, getAccountHistoryAsyncSpy } = prepare({
            accountHistoryLength: _.random(0, 999),
            batchSize: 1000,
        });

        const takenTransactions = await takeTransactionsFromSupplier(supplier);

        expect(getAccountHistoryAsyncSpy.callCount).to.be.equal(1);
    });

    it("queries with correct batchSize", async () => {
        const batchSize = Math.floor(Math.random() * 1000);
        const { username, supplier, getAccountHistoryAsyncSpy } = prepare({
            accountHistoryLength: _.random(0, batchSize - 1),
            batchSize: batchSize,
        });

        const takenTransactions = await takeTransactionsFromSupplier(supplier);

        expect(getAccountHistoryAsyncSpy.callCount).to.be.equal(1);
        expect(getAccountHistoryAsyncSpy.firstCall.args).to.deep.equal([username, -1, batchSize]);
    });

    it("query batches does not overlap", async () => {
        const batchSize = Math.floor(Math.random() * 1000);
        const numBatches = _.random(5, 10);
        const { username, supplier, getAccountHistoryAsyncSpy, fakeAccountHistoryOps } = prepare({
            accountHistoryLength: batchSize * numBatches,
            batchSize: batchSize,
        });

        const takenTransactions = await takeTransactionsFromSupplier(supplier);

        let sum = 0;
        for (const call of getAccountHistoryAsyncSpy.getCalls()) {
            sum += (await call.returnValue).length;
        }
        expect(sum).to.be.equal(fakeAccountHistoryOps.length);
        expect(getAccountHistoryAsyncSpy.callCount).to.be.equal(numBatches);
    });

    it("supplies all transactions returned by a single batch", async () => {
        const { supplier, getAccountHistoryAsyncSpy, fakeAccountHistoryOps } = prepare({
            accountHistoryLength: _.random(0, 999),
            batchSize: 1000,
        });

        const takenTransactions = await takeTransactionsFromSupplier(supplier);

        const suppliedTrxIds = fakeAccountHistoryOps.map(op => op[1].trx_id);
        const takenTrxIds = takenTransactions.map(trx => trx.transaction_id);

        expect(getAccountHistoryAsyncSpy.callCount).to.be.equal(1);
        expect(takenTrxIds).to.have.members(suppliedTrxIds);
    });

    it("supplies all transactions returned by a multiple batches", async () => {
        const { supplier, getAccountHistoryAsyncSpy, fakeAccountHistoryOps } = prepare({
            accountHistoryLength: _.random(500, 1000),
            batchSize: 100,
        });

        const takenTransactions = await takeTransactionsFromSupplier(supplier);

        const suppliedTrxIds = fakeAccountHistoryOps.map(op => op[1].trx_id);
        const takenTrxIds = takenTransactions.map(trx => trx.transaction_id);

        expect(getAccountHistoryAsyncSpy.callCount).to.be.greaterThan(1);
        expect(takenTrxIds).to.have.members(suppliedTrxIds);
    });

    [{ desc: "single batch", batches: 1 }, { desc: "multiple batches", batches: _.random(5, 10) }].forEach(test =>
        it(
            "supplies transactions from " + test.desc + " in a correct order: from the newest to the oldest",
            async () => {
                const { supplier, getAccountHistoryAsyncSpy } = prepare({
                    accountHistoryLength: 1000 * test.batches - 1,
                    batchSize: 1000,
                });

                const takenTransactions = await takeTransactionsFromSupplier(supplier);

                expect(getAccountHistoryAsyncSpy.callCount).to.be.equal(test.batches);

                let prevTrxMoment = Number.MAX_VALUE;
                for (const takenTrx of takenTransactions) {
                    const trxMoment = Number.parseFloat(takenTrx.block_num + "." + takenTrx.transaction_num);
                    expect(trxMoment).to.be.lessThan(prevTrxMoment);
                    prevTrxMoment = trxMoment;
                }
            }
        )
    );

    it("stops supplying after takeFn returns false", async () => {
        const { supplier } = prepare({
            accountHistoryLength: 50,
            batchSize: 10,
        });

        const takeCount = 15;
        const takenTransactions = await takeTransactionsFromSupplier(supplier, takeCount);

        expect(takenTransactions.length).to.be.equal(takeCount);
    });

    it("stops querying after takeFn returns false", async () => {
        const { supplier, getAccountHistoryAsyncSpy, params, fakeAccountHistoryOps } = prepare({
            accountHistoryLength: 50,
            batchSize: 10,
        });

        const takeCount = 15;
        const takenTransactions = await takeTransactionsFromSupplier(supplier, takeCount);

        expect(getAccountHistoryAsyncSpy.callCount).to.be.equal(2);
    });

    it("stops querying after error is caught", async () => {
        const { supplier, adapter } = prepare({ accountHistoryLength: 50, batchSize: 10 });

        const getAccountHistoryAsyncSpy = sinon.fake.rejects(new Error("Test error"));
        adapter.getAccountHistoryAsync = getAccountHistoryAsyncSpy;

        try {
            await takeTransactionsFromSupplier(supplier);
        } catch (error) {
            // expected
        }

        expect(getAccountHistoryAsyncSpy.callCount).to.be.equal(1);
    });

    it("rejects after error is caught", async () => {
        const { supplier, adapter } = prepare({ accountHistoryLength: 50, batchSize: 10 });

        const getAccountHistoryAsyncSpy = sinon.fake.rejects(new Error("Test error"));
        adapter.getAccountHistoryAsync = getAccountHistoryAsyncSpy;

        try {
            await takeTransactionsFromSupplier(supplier);
            throw new Error("Should throw");
        } catch (error) {
            expect(error)
                .to.be.instanceOf(Error)
                .that.haveOwnProperty("message")
                .that.is.equal("Test error");
        }
    });

    it("joins operations that are split to the separate batches", async () => {
        function doubleOpsGenerator(username: string, length: number): steem.AccountHistory.Operation [] {
            const ops = _.range(0, length).map(index => {
                const blockNum = Math.floor(index / 6);
                const trxNum = Math.floor((index - (blockNum * 6)) / 2);
                const opNum = index % 2;

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
                        block: blockNum,
                        op: op,
                        op_in_trx: opNum,
                        timestamp: new Date(Date.now() - 10000 + trxNum).toISOString(),
                        trx_id: "trx_" + trxNum,
                        trx_in_block: trxNum,
                        virtual_op: 0,
                    },
                ];
                return accHistop;
            });
            return ops;
        }

        const { supplier, adapter, fakeAccountHistoryOps } = prepare({ accountHistoryLength: 50, batchSize: 10, customOpsGenerator: doubleOpsGenerator });
    });

    it("operations in transaction have correct order", async () => {
        throw new Error("Specify");
    });

    it("does not duplicate transactions", async () => {
        throw new Error("Specify");
    });
});
