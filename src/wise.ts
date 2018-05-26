import { Promise } from "bluebird";

import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { ChainableSupplier } from "./chainable/Chainable";
import { Protocol } from "./protocol/Protocol";
import { V1Handler } from "./protocol/versions/v1/V1Handler";
import { ProtocolVersionHandler } from "./protocol/versions/ProtocolVersionHandler";
import { DirectBlockchainApi } from "./api/directblockchain/DirectBlockchainApi";
import { Api } from "./api/Api";
import { SendVoteorder } from "./protocol/SendVoteorder";
import { ProggressCallback } from "./ProggressCallback";
import { SmartvotesOperation } from "./protocol/SmartvotesOperation";
import { SetRules } from "./protocol/SetRules";
import { SteemOperation } from "./blockchain/SteemOperation";
import { ValidationError } from "./validation/ValidationError";
import { Validator } from "./validation/Validator";
import { Synchronizer } from "./Synchronizer";

/**
 * TODO blockchain input sanitization (prevent malicious json)
 * TODO rename smartvotes to wise
 * TODO comments
 * TODO unit tests
 * TODO update packages
 * TODO npm audit, snyk audit
 */

/**
 * Wise is a vote delegation system for steem blockchain.
 */
export class Wise {
    private username: string;
    private api: Api;
    private protocol: Protocol;

    /**
     * Constructor for Wise object.
     * @param username — steem username for performing operations (a voter if sending voteorder, a delegator if sending rules)
     * @param api — an Api (Direct blockchain api, our REST database, or any custom api)
     * @param protocol (optional) —  a Protocol object with Protocol version handlers specified
     */
    constructor(username: string, api: Api, protocol?: Protocol) {
        this.username = username;
        this.api = api;
        if (protocol) {
            this.protocol = protocol;
        }
        else {
            this.protocol = new Protocol([
                new V1Handler()
            ]);
        }
    }

    /**
     * Sends rulesets.
     * @param voter — voter for whom these rulesets are empowered.
     * @param rules — SetRules object
     * @param callback — a Callback
     * @param proggressCallback (optional) proggress callback — will receive proggress notifications (useful for UI)
     */ // TODO test
    public sendRules = (voter: string, rules: SetRules,
        callback: (error: Error | undefined, result: SteemOperationNumber | undefined) => void,
        proggressCallback?: ProggressCallback
    ): void => {
        // TODO proggress callback

        const smOp: SmartvotesOperation = {
            voter: voter,
            delegator: this.username,
            command: rules
        };

        new Promise<[string, object][]>((resolve, reject) => {
            const steemOps: [string, object][] = this.protocol.serializeToBlockchain(smOp);
            if (steemOps.length !== 1) reject(new Error("SetRules should be a single blockchain operation"));
            else resolve(steemOps);
        })
        .then((steemOps: [string, object][]) => {
            if (this.validateOperation(steemOps[0])) return (steemOps);
            else throw new Error("Operation object has invalid structure");
        })
        .then((steemOps: [string, object][]) => this.api.sendToBlockchain(steemOps))
        .then((son: SteemOperationNumber) => callback(undefined, son))
        .catch(error => callback(error, undefined));
    }

    /**
     * Sends a voteorder
     * @param delegator — delegator username
     * @param voteorder — SendVoteorder object
     * @param callback — a callback
     * @param proggressCallback (optional)
     * @param skipValidation (optional)
     */ // TODO test
    public sendVoteorder = (delegator: string, voteorder: SendVoteorder,
        callback: (error: Error | undefined, result: SteemOperationNumber | undefined) => void,
        proggressCallback?: ProggressCallback, skipValidation?: boolean): void => {

        // TODO proggress callback

        const smOp: SmartvotesOperation = {
            voter: this.username,
            delegator: delegator,
            command: voteorder
        };

        new Promise<[string, object][]>((resolve, reject) => {
            const steemOps: [string, object][] = this.protocol.serializeToBlockchain(smOp);
            if (steemOps.length !== 1) reject(new Error("An voteorder should be a single blockchain operation"));
            else resolve(steemOps);
        })
        .then((steemOps: [string, object][]) => {
            if (skipValidation) return steemOps;
            else if (this.validateOperation(steemOps[0])) return steemOps;
            else throw new Error("Operation object has invalid structure");
        }).then((steemOps: [string, object][]) => { return new Promise<[string, object][]>((resolve, reject) => {
            if (skipValidation) resolve(steemOps);
            else this.validateVoteorder(delegator, this.username, voteorder, SteemOperationNumber.FUTURE,
                (error: Error | undefined, result: ValidationError | true) => {
                    if (error) reject(error);
                    else if (result !== true) reject(result);
                    else resolve(steemOps);
                });
        }); })
        .then((steemOps: [string, object][]) => this.api.sendToBlockchain(steemOps))
        .then((son: SteemOperationNumber) => callback(undefined, son))
        .catch(error => callback(error, undefined));
    }

    /**
     * Validated if steem operation it is a valid smartvotes
     * @param op — an steem operation in format: [string, object] object (if it is a pending operation block_num should equal Infinity)
     */ // TODO test
    public validateOperation = (op: [string, object]): boolean => {
        const so: SteemOperation = {
            block_num: Infinity,
            transaction_num: 0,
            transaction_id: "",
            operation_num: 0,
            timestamp: new Date(),
            op: op
        };
        return this.protocol.handleOrReject(so) != undefined;
    }

    /**
     * Loads rulesets set by the delegator for this user.
     * @param delegator — delegator username
     * @param atMoment — a moment in blockchain
     * @param callback — a callback
     */ // TODO test
    public getRulesets = (delegator: string, atMoment: SteemOperationNumber, callback: (error: Error | undefined, result: SetRules | undefined) => void): void => {
        this.api.loadRulesets(delegator, this.username, atMoment, this.protocol)
        .then((rules: SetRules) => callback(undefined, rules))
        .catch(error => callback(error, undefined));
    }

    /**
     * Validates an Voteorder
     * @param delegator — delegator username
     * @param delegator — voter username
     * @param voteorder - an SendVoteorder object
     * @param atMoment — a moment in blockchain at which we are testing validity SteemOperationNumber
     * @param callback — a callback. Note that result is a true if valid (=== true), or ValidationError (== true, but !== true). So you should always use triple comparison operator
     * @param proggressCallback — a proggress callback
     */ // TODO test
    public validateVoteorder = (delegator: string, voter: string, voteorder: SendVoteorder, atMoment: SteemOperationNumber,
        callback: (error: Error | undefined, result: ValidationError | true) => void,
        proggressCallback: ProggressCallback = function(msg, percent) {}): void => {
            new Validator(this.api, this.protocol).validate(delegator, voter, voteorder, callback, proggressCallback);
    }

    /**
     * Loops through blockchain operations starting from *since*. When it reaches the HEAD it loops through newcoming operations.
     * It stops when notifierCallback returns false
     * @param since - where to start sinchronization
     * @param notifierCallback - a callback which is notified every time an event occurs. It should return true to continue synchronization, or false if to stop it.
     */ // TODO test
    public runSynchronizerLoop = (since: SteemOperationNumber, notifierCallback: (error: Error | undefined, message: string, moment: SteemOperationNumber) => boolean): void => {
        new Synchronizer(this.api, this.protocol, this.username).runLoop(since, notifierCallback);
    }

    /**
     * Returns current protocol
     */
    public getProtocol = (): Protocol => {
        return this.protocol;
    }
}

export default Wise;

export { Api } from "./api/Api";
export { DirectBlockchainApi } from "./api/directblockchain/DirectBlockchainApi";
export { WiseRESTApi } from "./api/WiseRESTApi";

export { SteemOperation } from "./blockchain/SteemOperation";
export { SteemOperationNumber } from "./blockchain/SteemOperationNumber";

export { Protocol } from "./protocol/Protocol";
export { SendVoteorder } from "./protocol/SendVoteorder";
export { SetRules } from "./protocol/SetRules";
export { SmartvotesOperation } from "./protocol/SmartvotesOperation";

export { AuthorsRule } from "./rules/AuthorsRule";
export { TagsRule } from "./rules/TagsRule";
export { CustomRPCRule } from "./rules/CustomRPCRule";
export { WeightRule } from "./rules/WeightRule";

export { ValidationError } from "./validation/ValidationError";

export { ProggressCallback } from "./ProggressCallback";
