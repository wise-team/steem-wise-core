// 3rd party imports
import { expect } from "chai";
import "mocha";
import * as steem from "steem";
import { Log } from "../../src/util/log";

// wise imports
import { Wise, UnifiedSteemTransaction } from "../../src/wise";
import { DisabledApi } from "../../src/api/DisabledApi";


/* PREPARE TESTING DATASETS */
const v1ValidOperations: SteemOperation [] = require("../data/operations/v1-valid.operations.json") as any as SteemOperation [];
const v1InvalidOperations: SteemOperation [] = require("../data/operations/v1-invalid.operations.json") as any as SteemOperation [];


describe("test/unit/protocol.spec.ts", function() {
    this.timeout(3000);

    describe("Protocol V1", () => {
        const wise = new Wise("", new DisabledApi());
        const protocol = wise.getProtocol();

        it ("Validates all previously valid V1 (smartvote) operations as valid", () => {
            for (const op of v1ValidOperations) {
                const result = wise.getProtocol().validateSteemTransaction(operationToTransaction(op));
                expect(result).to.be.true;
            }
        });

        it ("Validates all previously invalid V1 (smartvote) operations as invalid", () => {
            for (const op of v1InvalidOperations) {
                const result = wise.getProtocol().validateSteemTransaction(operationToTransaction(op));
                expect(result).to.be.false;
            }
        });
    });

    describe("Protocol", () => {
        describe("#validateOperation", () => {
            const protocol = new Wise("", new DisabledApi()).getProtocol();
            it("rejects valid v1 operation (this is disabled version of protocol). It is handled, but it is not valid according to new protocol", () => {
                const obj = JSON.parse('["custom_json",{"required_auths":[],"required_posting_auths":["steemprojects1"],"id":"smartvote","json":"{\\"name\\":\\"send_voteorder\\",\\"voteorder\\":{\\"ruleset_name\\":\\"RulesetOneChangesContent\\",\\"delegator\\":\\"steemprojects2\\",\\"type\\":\\"upvote\\",\\"weight\\":10,\\"author\\":\\"pojan\\",\\"permlink\\":\\"how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad\\"}}"}]');
                expect(protocol.validateOperation(obj)).to.be.false;
            });

            /* tslint:disable:whitespace */
            const validV2Ops: steem.OperationWithDescriptor[] = [
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{\"delegator\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:set_rules\",{\"voter\":\"guest123\",\"rulesets\":[[\"test_purpose_ruleset\",[{\"rule\":\"weight\",\"mode\":\"single_vote_weight\",\"min\":0,\"max\":1000},{\"rule\":\"tags\",\"mode\":\"require\",\"tags\":[\"steemprojects\"]}]]]}]",required_auths:[],required_posting_auths:["guest123"]}]
            ];
            validV2Ops.forEach((op: steem.OperationWithDescriptor) => {
                it("passes valid v2 operation", () => {
                    expect(protocol.validateOperation(op)).to.be.true;
                });
            });

            const invalidV2Ops: steem.OperationWithDescriptor[] = [
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorde\",{\"delegator\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v3:send_voteorder\",{\"delegator\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{\"deleg\":\"guest123\",\"ruleset\":\"test_purpose_ruleset\",\"author\":\"urbangladiator\",\"permlink\":\"hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem\",\"weight\":1000,\"sth_wrong\":1000}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{}]",required_auths:[],required_posting_auths:["guest123"]}],["custom_json",{id:"wise",json:"[\"v2:send_voteorder\",{\"a\":\"b\"}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:set_rules\",{\"voter\":\"guest123\",\"rulesets\":[[\"test_purpose_ruleset\",[{\"rule\":\"strange_rule\",\"mode\":\"single_vote_weight\",\"min\":0,\"max\":1000},{\"rule\":\"tags\",\"mode\":\"require\",\"tags\":[\"steemprojects\"]}]]]}]",required_auths:[],required_posting_auths:["guest123"]}],
                ["custom_json",{id:"wise",json:"[\"v2:set_rules\",{\"voter\":\"guest123\",\"rulesets\":[[\"test_purpose_ruleset\",[{\"rule\":\"weight\",\"mode\":\"single_vote_weight\",\"min\":0,\"max\":20000},{\"rule\":\"tags\",\"mode\":\"require\",\"tags\":[\"steemprojects\"]}]]]}]",required_auths:[],required_posting_auths:["guest123"]}]
            ];
            invalidV2Ops.forEach((op: steem.OperationWithDescriptor) => {
                it("rejects invalid v2 operation", () => {
                    expect(protocol.validateOperation(op)).to.be.false;
                });
            });
            /* tslint:enable:whitespace */
        });
    });
});



interface SteemOperation {
    block_num: number;
    transaction_num: number;
    transaction_id: string;
    timestamp: Date;
    op: steem.OperationWithDescriptor;
}

function operationToTransaction(op: SteemOperation): UnifiedSteemTransaction {
    const tx: UnifiedSteemTransaction = {
        block_num: op.block_num,
        transaction_num: op.transaction_num,
        transaction_id: op.transaction_id,
        timestamp: op.timestamp,
        ops: [op.op]
    };
    return tx;
}