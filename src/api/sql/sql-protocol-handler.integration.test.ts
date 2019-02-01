import "mocha";
import * as _ from "lodash";
import { expect } from "chai";
import { d } from "../../util/util";

import { Log } from "../../log/Log";

// wise imports
import { SteemOperationNumber } from "steem-efficient-stream";
import { WiseSQLProtocol } from "../../wise";

describe("test/integration/sql-protocol-handler.spec.ts", () => {
    describe("WiseSQLProtocol", () => {
        const endpointUrl = /*§ §*/ "https://sql.wise.vote/" /*§ ' "' + data.config.sql.url.production + '" ' §.*/;

        describe(".Handler.Query", function() {
            this.timeout(50000);

            it("Paginates correctly get request", async () => {
                const result = await WiseSQLProtocol.Handler.query(
                    { endpointUrl: endpointUrl, path: "/operations", method: "get", limit: 2001 },
                    true
                );
                expect(result)
                    .to.be.an("array")
                    .with.length(2001);
            });

            it("Paginates correctly post request", async () => {
                const result = await WiseSQLProtocol.Handler.query(
                    {
                        endpointUrl: endpointUrl,
                        path: "/rpc/rulesets_by_delegator_at_moment?delegator=noisy&moment=999999999999",
                        method: "get",
                        limit: 5,
                    },
                    true
                );
                expect(result)
                    .to.be.an("array")
                    .with.length(5);
            });
        });
    });
});
