import "mocha";
import * as _ from "lodash";
import { expect } from "chai";
import { data as wise } from "../../src/wise-config.gen";
import { d } from "../../src/util/util";

import { Log } from "../../src/util/log";

// wise imports
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";
import { WiseSQLProtocol } from "../../src/wise";


describe("test/integration/sql-protocol-handler.spec.ts", () => {
    describe("WiseSQLProtocol", () => {
        const endpointUrl = d(wise.config.sql.endpoint.schema) + "://" + d(wise.config.sql.endpoint.host);

        describe(".Handler.Query", function () {
            this.timeout(50000);

            it ("Paginates correctly get request", async () => {
               const result = await WiseSQLProtocol.Handler.query(
                    { endpointUrl: endpointUrl, path: "/operations", method: "get", limit: 2001 }, true
               );
               expect(result).to.be.an("array").with.length(2001);
            });

            it ("Paginates correctly post request", async () => {
                const result = await WiseSQLProtocol.Handler.query(
                    { endpointUrl: endpointUrl, path: "/rpc/rulesets_by_delegator_at_moment?delegator=noisy&moment=999999999999", method: "get", limit: 5 }, true
                );
                expect(result).to.be.an("array").with.length(5);
            });
        });
    });
});
