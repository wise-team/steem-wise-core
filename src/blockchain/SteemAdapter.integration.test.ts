import { expect, use as chaiUse } from "chai";
import * as chaiAsPromised from "chai-as-promised";
import "mocha";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as uuid from "uuid/v4";
import * as steem from "steem";

import { SteemAdapter } from "./SteemAdapter";
import { SteemAdapterImpl } from "./SteemAdapterImpl";
import { SteemApiConfig } from "./SteemApiConfig";
import { BlockchainConfig } from "./BlockchainConfig";

chaiUse(chaiAsPromised);

describe.only("SteemAdapter", function() {
    this.timeout(20 * 1000); // 20s

    type AccHistOp = steem.AccountHistory.Operation;
    const usernames: string[] = ["noisy", "jblew", "fervi", "diosbot"];
    function prepare() {
        const steemAdapter: SteemAdapter = new SteemAdapterImpl(SteemApiConfig.DEFAULT_ADAPTER_OPTIONS);
        const username: string = _.sample(usernames) || "-sample-returned-undefined-";
        return { steemAdapter, username };
    }

    function getAccountHistoryIndexOfOperation(op: AccHistOp): number {
        return op[0];
    }

    function getOperationMoment(op: AccHistOp) {
        return {
            trx_id: op[1].trx_id,
            block_num: op[1].block,
            trx_num: op[1].trx_in_block,
            op_num: op[1].op_in_trx,
            timestamp: new Date(op[1].timestamp + "Z").getTime(),
        };
    }
    function getOperationWithDescriptor(op: AccHistOp): steem.OperationWithDescriptor {
        return op[1].op;
    }

    describe("getAccountHistoryAsync", () => {
        it("when from=-1 returns newest operations", async () => {
            const { steemAdapter } = prepare();

            const from = -1,
                limit = 50,
                username = "noisy";
            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, from, limit);

            const minimalDateTimestamp = Date.now() - 1000 * 3600 * 24 * 60; // 60 days
            expect(getOperationMoment(ops[0]).timestamp > minimalDateTimestamp);
        });

        it("when from=-1 returns operations sorted by moment ascending", async () => {
            const { steemAdapter, username } = prepare();
            const from = -1,
                limit = 1000;

            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, from, limit);
            const timestamps = ops.map(op => getOperationMoment(op).timestamp);

            let prevTimestamp = 0;
            for (const timestamp of timestamps) {
                expect(timestamp).to.be.gte(prevTimestamp);
                prevTimestamp = timestamp;
            }
        });

        it("when from > 0 returns operations sorted by moment ascending", async () => {
            const { steemAdapter, username } = prepare();
            const from = Math.floor(10000 + Math.random() * 10000),
                limit = 1000;

            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, from, limit);
            const timestamps = ops.map(op => getOperationMoment(op).timestamp);

            let prevTimestamp = 0;
            for (const timestamp of timestamps) {
                expect(timestamp).to.be.gte(prevTimestamp);
                prevTimestamp = timestamp;
            }
        });

        it("when from > 0 returns operations with indexes lower (or equal) than from", async () => {
            const { steemAdapter, username } = prepare();
            const from = Math.floor(10000 + Math.random() * 10000),
                limit = 1000;

            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, from, limit);
            const indexes = ops.map(op => getAccountHistoryIndexOfOperation(op));

            expect(indexes)
                .to.be.an("array")
                .with.length.greaterThan(limit * 0.9);
            for (const index of indexes) {
                expect(index).to.be.lte(from);
            }
        });

        it("when from > 0 the last returned operartion has index equal to from", async () => {
            const { steemAdapter, username } = prepare();
            const from = Math.floor(5000 + Math.random() * 6000),
                limit = 1000;

            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, from, limit);
            const indexes = ops.map(op => getAccountHistoryIndexOfOperation(op));

            expect(indexes)
                .to.be.an("array")
                .with.length.greaterThan(limit * 0.9);
            expect(_.last(indexes)).to.be.equal(from);
        });

        it("when from > 0 returns ($limit+1) operations", async () => {
            const { steemAdapter, username } = prepare();
            const from = Math.floor(10000 + Math.random() * 10000),
                limit = 1000;

            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, from, limit);
            const indexes = ops.map(op => getAccountHistoryIndexOfOperation(op));

            expect(indexes)
                .to.be.an("array")
                .with.length(limit + 1);
        });

        it("when from > 0 but lower than $limit, throws 'start must be greater than limit'", async () => {
            const { steemAdapter, username } = prepare();
            const from = Math.floor(Math.random() * 600),
                limit = 1000;

            try {
                const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, from, limit);
                throw new Error("Should throw");
            } catch (error) {
                expect(error.message).to.contain("start must be greater than limit");
            }
        });

        it("returns custom_json and vote operations", async () => {
            const { steemAdapter } = prepare();

            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(
                "noisy",
                50 * 1000,
                BlockchainConfig.ACCOUNT_HISTORY_MAX_BATCH_SIZE
            );
            const descriptors = ops.map(op => getOperationWithDescriptor(op)[0]);

            expect(descriptors).to.include.members(["custom_json", "vote"]);
        });

        it("returns only operations of specified user", async () => {
            const { steemAdapter, username } = prepare();

            const ops: AccHistOp[] = await steemAdapter.getAccountHistoryAsync(username, -1, 500);
            const opsWithDescriptors = ops.map(op => getOperationWithDescriptor(op));
            opsWithDescriptors.forEach(opd => {
                if (opd[0] == "custom_json") {
                    expect(opd[1])
                        .to.haveOwnProperty("required_posting_auths")
                        .that.is.an("array")
                        .that.include(username);
                } else if (opd[0] == "vote") {
                    const voteOp = opd[1] as steem.VoteOperation;
                    expect(voteOp.voter === username || voteOp.author === username).to.be.true;
                }
            });
        });
    });

    describe("options", () => {
        describe("url", () => {
            it("sets the url for query", async () => {
                const mockedHost = "mock-steem-api-" + uuid();
                const mockedUrl = `https://${mockedHost}/`;
                const steemAdapter: SteemAdapter = new SteemAdapterImpl({
                    ...SteemApiConfig.DEFAULT_ADAPTER_OPTIONS,
                    url: mockedUrl,
                });
                try {
                    await steemAdapter.getAccountHistoryAsync("noisy", -1, 50);
                    throw new Error("Should throw");
                } catch (error) {
                    expect(error).to.be.instanceOf(SteemAdapter.SteemError);
                    expect(error.message)
                        .to.contain("ENOTFOUND")
                        .and.contain(mockedHost);
                }
            });
        });
    });
});
