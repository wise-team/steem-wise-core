import { Promise } from "bluebird";
import * as _ from "lodash";

import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";
import { Protocol } from "./protocol/Protocol";
import { V1Handler } from "./protocol/versions/v1/V1Handler";
import { Api } from "./api/Api";
import { SendVoteorder } from "./protocol/SendVoteorder";
import { ProggressCallback } from "./ProggressCallback";
import { SmartvotesOperation } from "./protocol/SmartvotesOperation";
import { SetRules, SetRulesForVoter } from "./protocol/SetRules";
import { SteemTransaction } from "./blockchain/SteemTransaction";
import { ValidationException } from "./validation/ValidationException";
import { Validator } from "./validation/Validator";
import { Synchronizer } from "./Synchronizer";
import { V2Handler } from "./protocol/versions/v2/V2Handler";
import { RulesUpdater } from "./RulesUpdater";
import { Log } from "./util/log";

Log.configureLoggers();
const log = Log.getLogger();
/**
 * TODO blockchain input sanitization (prevent malicious json)
 * TODO rename smartvotes to wise
 * TODO comments
 * TODO unit tests
 * TODO update packages
 * TODO npm audit, snyk audit
 * // TODO run mocha unit tests in browser (selenium?)
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
                new V2Handler(),
                new V1Handler()
            ]);
        }
    }

    // TODO comment
    public sendRulesAsync = (voter: string, rules: SetRules, proggressCallback?: ProggressCallback
    ): Promise<SteemOperationNumber> => {
        // TODO proggress callback

        const smOp: SmartvotesOperation = {
            voter: voter,
            delegator: this.username,
            command: rules
        };

        return new Promise<[string, object][]>((resolve, reject) => {
            const steemOps: [string, object][] = this.protocol.serializeToBlockchain(smOp);
            if (steemOps.length !== 1) reject(new Error("SetRules should be a single blockchain operation"));
            else resolve(steemOps);
        })
        .then((steemOps: [string, object][]) => {
            if (this.validateOperation(steemOps[0])) return (steemOps);
            else throw new Error("Operation object has invalid structure");
        })
        .then((steemOps: [string, object][]) => this.api.sendToBlockchain(steemOps));
    }

    /**
     * Sends rulesets.
     * @param voter — voter for whom these rulesets are empowered.
     * @param rules — SetRules object
     * @param callback — a Callback
     * @param proggressCallback (optional) proggress callback — will receive proggress notifications (useful for UI)
     */
    public sendRules = (voter: string, rules: SetRules,
        callback: (error: Error | undefined, result: SteemOperationNumber | undefined) => void,
        proggressCallback?: ProggressCallback
    ): void => {
        this.sendRulesAsync(voter, rules, proggressCallback)
        .then((son: SteemOperationNumber) => callback(undefined, son))
        .catch(error => callback(error, undefined));
    }

    // TODO comment // TODO test
    public generateVoteorderCustomJSONAsync = (delegator: string, voteorder: SendVoteorder,
        proggressCallback: ProggressCallback = () => {}, skipValidation: boolean = false): Promise<[string, object][]> => {

        // TODO proggress callback

        const smOp: SmartvotesOperation = {
            voter: this.username,
            delegator: delegator,
            command: voteorder
        };
        let steemOps: [string, object][];
        return Promise.resolve()
        .then(() => {
            steemOps = this.protocol.serializeToBlockchain(smOp);
            if (steemOps.length !== 1) throw new Error("An voteorder should be a single blockchain operation");
        })
        .then(() => {
            if (skipValidation) return;
            else if (!this.validateOperation(steemOps[0])) throw new Error("Operation object has invalid structure");
        }).then(() => {
            if (skipValidation) return Promise.resolve();
            else return this.validatePotentialVoteorderAsync(delegator, this.username, voteorder)
            .then((result: ValidationException | true) => {
                if (result !== true) throw new Error("Validation error: " + result.message);
             });
        })
        .then(() => steemOps);
    }

    /**
     * Sends a voteorder
     * @param delegator — delegator username
     * @param voteorder — SendVoteorder object
     * @param callback — a callback
     * @param proggressCallback (optional)
     * @param skipValidation (optional)
     */
    public sendVoteorderAsync = (delegator: string, voteorder: SendVoteorder,
        proggressCallback: ProggressCallback = () => {}, skipValidation: boolean = false): Promise<SteemOperationNumber> => {

        return this.generateVoteorderCustomJSONAsync(delegator, voteorder, proggressCallback, skipValidation)
        .then((steemOps) => this.api.sendToBlockchain(steemOps));
    }

    // TODO comment
    public sendVoteorder = (delegator: string, voteorder: SendVoteorder,
        callback: (error: Error | undefined, result: SteemOperationNumber | undefined) => void,
        proggressCallback: ProggressCallback = () => {}, skipValidation: boolean = false): void => {

        this.sendVoteorderAsync(delegator, voteorder, proggressCallback)
        .then((result: SteemOperationNumber) => callback(undefined, result))
        .catch((error: Error) => callback(error, undefined));
    }

    /**
     * Validated if steem operation it is a valid smartvotes
     * @param op — an steem operation in format: [string, object] object (if it is a pending operation block_num should equal Infinity)
     */ // TODO test
    public validateOperation = (op: [string, object]): boolean => {
        const so: SteemTransaction = {
            block_num: Infinity,
            transaction_num: 0,
            transaction_id: "",
            timestamp: new Date(),
            ops: [op]
        };
        return this.validateSteemTransaction(so);
    }

    /**
     * Validated if steem operation (object with blockchain data and timestamp) it is a valid smartvotes
     * @param op — an steem operation object that implements SteemTransaction interface
     */ // TODO test
     public validateSteemTransaction = (so: SteemTransaction): boolean => {
        const res = this.protocol.handleOrReject(so);
        return res != undefined;
    }

    /**
     * Loads rulesets set by the delegator for this user.
     * @param delegator — delegator username
     * @param atMoment — a moment in blockchain
     * @param callback — a callback
     */ // TODO test
    public getRulesetsAsync = (delegator: string, atMoment: SteemOperationNumber = SteemOperationNumber.FUTURE): Promise<SetRules> => {
        return this.api.loadRulesets(delegator, this.username, atMoment, this.protocol);
    }

    // TODO comment
    public getRulesets = (delegator: string, atMoment: SteemOperationNumber, callback: (error: Error | undefined, result: SetRules | undefined) => void): void => {
        this.getRulesetsAsync(delegator, atMoment)
        .then((rules: SetRules) => callback(undefined, rules))
        .catch(error => callback(error, undefined));
    }

    // TODO comment
    public diffAndUpdateRulesAsync = (rules: SetRulesForVoter [], proggressCallback: ProggressCallback= () => {}): Promise<SteemOperationNumber | true> => {
        return RulesUpdater.updateRulesIfChanged(this.api, this.protocol, this.username, rules, proggressCallback);
    }

    // TODO comment
    public diffAndUpdateRules = (rules: SetRulesForVoter [], callback: (error: Error | undefined, result: SteemOperationNumber | true | undefined) => void, proggressCallback: ProggressCallback= () => {}): Promise<void> => {
        return this.diffAndUpdateRulesAsync(rules, proggressCallback)
        .then(
            (result: SteemOperationNumber | true) => {
                callback(undefined, result);
            },
            (error: Error) => {
                callback(error, undefined);
            }
        );
    }

    /**
     * Validates an Voteorder
     * @param delegator — delegator username
     * @param delegator — voter username
     * @param voteorder - an SendVoteorder object
     * @param atMoment — a moment in blockchain at which we are testing validity SteemOperationNumber
     * @param callback — a callback. Note that result is a true if valid (=== true), or ValidationException (== true, but !== true). So you should always use triple comparison operator
     * @param proggressCallback — a proggress callback
     */ // TODO test
    public validateVoteorderAsync = (delegator: string, voter: string, voteorder: SendVoteorder, atMoment: SteemOperationNumber,
        proggressCallback?: ProggressCallback): Promise<ValidationException | true> => {
            const v = new Validator(this.api, this.protocol);
            if (proggressCallback) v.withProggressCallback(proggressCallback);

            return v.validate(delegator, voter, voteorder, atMoment);
    }

    public validateVoteorder = (delegator: string, voter: string, voteorder: SendVoteorder, atMoment: SteemOperationNumber,
        callback: (error: Error | undefined, result: undefined | ValidationException | true) => void,
        proggressCallback?: ProggressCallback): void => {
            this.validateVoteorderAsync(delegator, voter, voteorder, atMoment, proggressCallback)
            .then((result: ValidationException | true) => callback(undefined, result))
            .catch((error: Error) => callback(error, undefined));
    }

    /**
     * Validates a potential Voteorder
     * @param delegator — delegator username
     * @param delegator — voter username
     * @param voteorder - an SendVoteorder object
     * @param atMoment — a moment in blockchain at which we are testing validity SteemOperationNumber
     * @param callback — a callback. Note that result is a true if valid (=== true), or ValidationException (== true, but !== true). So you should always use triple comparison operator
     * @param proggressCallback — a proggress callback
     */ // TODO test
     public validatePotentialVoteorderAsync = (delegator: string, voter: string, voteorder: SendVoteorder,
        proggressCallback?: ProggressCallback): Promise<ValidationException | true> => {
        return this.validateVoteorderAsync(delegator, voter, voteorder, SteemOperationNumber.FUTURE, proggressCallback);
    }

    // TODO comment
    public validatePotentialVoteorder = (delegator: string, voter: string, voteorder: SendVoteorder,
        callback: (error: Error | undefined, result: undefined | ValidationException | true) => void,
        proggressCallback?: ProggressCallback): void => {
        this.validateVoteorder(delegator, voter, voteorder, SteemOperationNumber.FUTURE, callback, proggressCallback);
    }

    /**
     * Loops through blockchain operations starting from *since*. When it reaches the HEAD it loops through newcoming operations.
     * It stops when notifierCallback returns false
     * @param since - where to start sinchronization
     * @param notifierCallback - a callback which is notified every time an event occurs. It should return true to continue synchronization, or false if to stop it.
     */ // TODO test
    public runSynchronizerLoop = (since: SteemOperationNumber, notifierCallback: Synchronizer.NotifierCallback): Synchronizer => {
        return new Synchronizer(this.api, this.protocol, this.username, notifierCallback).runLoop(since);
    }

    // TODO comment
    // TODO test
     public getLastConfirmationMomentAsync = (): Promise<undefined | SteemOperationNumber> => {
        return this.api.getLastConfirmationMoment(this.username, this.getProtocol());
    }

    // TODO comment
    // TODO test
    public getLastConfirmationMoment = (callback: (error: Error | undefined, result: undefined | SteemOperationNumber) => void): void => {
        this.getLastConfirmationMomentAsync()
        .then((son: SteemOperationNumber | undefined) => callback(undefined, son))
        .catch((error: Error) => callback(error, undefined));
    }

    /**
     * Returns current protocol
     */
    public getProtocol = (): Protocol => {
        return this.protocol;
    }
}

export { Api } from "./api/Api";
export { DirectBlockchainApi } from "./api/directblockchain/DirectBlockchainApi";
export { WiseRESTApi } from "./api/WiseRESTApi";
export { DisabledApi } from "./api/DisabledApi";

export { SteemTransaction } from "./blockchain/SteemTransaction";
export { SteemOperationNumber } from "./blockchain/SteemOperationNumber";

export { Protocol } from "./protocol/Protocol";
export { SendVoteorder } from "./protocol/SendVoteorder";
export { SetRules, SetRulesForVoter, EffectuatedSetRules } from "./protocol/SetRules";
export { SmartvotesOperation } from "./protocol/SmartvotesOperation";
export { EffectuatedSmartvotesOperation } from "./protocol/EffectuatedSmartvotesOperation";

export { Rule } from "./rules/Rule";
export { AuthorsRule } from "./rules/AuthorsRule";
export { TagsRule } from "./rules/TagsRule";
export { CustomRPCRule } from "./rules/CustomRPCRule";
export { WeightRule } from "./rules/WeightRule";
export { VotingPowerRule } from "./rules/VotingPowerRule";
export { AgeOfPostRule } from "./rules/AgeOfPostRule";
export { FirstPostRule } from "./rules/FirstPostRule";
export { PayoutRule } from "./rules/PayoutRule";
export { VotersRule } from "./rules/VotersRule";
export { VotesCountRule } from "./rules/VotesCountRule";
export { WeightForPeriodRule } from "./rules/WeightForPeriodRule";
export { ExpirationDateRule } from "./rules/ExpirationDateRule";


export { ValidationException } from "./validation/ValidationException";

export { ProggressCallback } from "./ProggressCallback";
export { NotFoundException } from "./util/NotFoundException";

export { Synchronizer } from "./Synchronizer";
export { Log } from "./util/log";

export * from "./protocol/versions/v2/wise-schema";

export default Wise;