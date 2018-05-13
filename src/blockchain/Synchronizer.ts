import { Promise } from "bluebird";
import { AccountHistorySupplier, SmartvotesFilter, OperationNumberFilter, SimpleTaker,
    ToSmartvotesOperationTransformer, SmartvotesOperationTypeFilter,
    ChainableLimiter, BiTransformer, OperationTypeFilter, OperationNumberLimiter } from "../chainable/_exports";
import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_ruleset, smartvotes_command_confirm_votes } from "../schema/smartvotes.schema";
import { RawOperation, VoteOperation, CustomJsonOperation } from "../blockchain/blockchain-operations-types";
import { _objectAssign } from "../util/util";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { RulesValidator } from "../validation/RulesValidator";
import { VoteConfirmedAtMoment, VoteorderAtMoment, RulesetsAtMoment } from "../validation/smartvote-types-at-moment";
import { ValidationError } from "../validation/ValidationError";

export interface SynchronizationResult {
    rulesAtMoment: RulesetsAtMoment [];
    confirmedVotes: VoteConfirmedAtMoment [];
    validVoteorders: VoteorderAtMoment [];
    invalidVoteorders: [VoteorderAtMoment, string][];
}

export class Synchronizer {
    private steem: any;
    private username: string;
    private postingWif: string;
    private proggressCallback: (msg: string, proggress: number) => void = (msg, proggress) => {};
    private validationOnly: boolean = false;
    private concurrency: number = 4;
    private beforeMoment: SteemOperationNumber = SteemOperationNumber.FUTURE;

    constructor(steem: any, username: string, postingWif: string) {
        this.steem = steem;
        this.username = username;
        this.postingWif = postingWif;
    }

    public withProggressCallback(proggressCallback: (msg: string, proggress: number) => void): Synchronizer {
        this.proggressCallback = proggressCallback;
        return this;
    }

    public validateOnly(validationOnly: boolean): Synchronizer {
        this.validationOnly = validationOnly;
        return this;
    }

    public withConcurrency(concurrency: number): Synchronizer {
        this.concurrency = concurrency;
        return this;
    }

    public atMoment(moment: SteemOperationNumber): Synchronizer {
        this.beforeMoment = moment;
        return this;
    }

    public synchronize = (callback: (error: Error | undefined, result: SynchronizationResult | undefined) => void, ): void => {
        this.proggressCallback("Loading rulesets since last synchronized voteorder", 0);

        this.loadUnsynchronizedOperations()
        .then(this.loadVoteorders)
        .then(this.removeAlreadyConfirmedVotes)
        .then(this.sortVoteordersFromOldestToNewest)
        .then(this.validate)
        .then((input: SynchronizationResult) => {
            if (this.validationOnly) return input;
            else return this.vote(input);
        })
        .then((input: SynchronizationResult) => { callback(undefined, input); })
        .catch((error: Error) => callback(error, undefined));
    }

    private loadUnsynchronizedOperations = (): Promise<{rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment []}> => {
        return new Promise((resolve, reject) => {
            let rulesets: RulesetsAtMoment [] = [];
            const confirmedVotes: VoteConfirmedAtMoment [] = [];

            let foundVoteConfirmation = false;
            let previousRulesetOpNum = new SteemOperationNumber(Infinity, Infinity, Infinity);

            new AccountHistorySupplier(this.steem, this.username)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", this.beforeMoment))
                .chain(new SmartvotesFilter())
                .chain(new BiTransformer())
                .chain(new SimpleTaker((item: {rawOp: RawOperation, op: smartvotes_operation}): boolean => {
                    if (item.op.name === "confirm_votes") {
                        for (let i = 0; i < item.op.voteorders.length; i++) {
                            const confirmedVo = item.op.voteorders[i];
                            const confirmedVoAtMoment: VoteConfirmedAtMoment = {
                                opNum: SteemOperationNumber.fromOperation(item.rawOp),
                                voteorderTransactionId: confirmedVo.transaction_id,
                                voteorderOperationNum: confirmedVo.operation_num
                            };
                            confirmedVotes.push(confirmedVoAtMoment);
                        }
                        foundVoteConfirmation = true;
                    }
                    else if (item.op.name === "set_rules") {
                        rulesets.push({
                            opNum: SteemOperationNumber.fromOperation(item.rawOp),
                            rulesets: item.op.rulesets,
                            validityUntil: previousRulesetOpNum // commands are returned from oldest to newest
                        });
                        previousRulesetOpNum = SteemOperationNumber.fromOperation(item.rawOp);

                        if (foundVoteConfirmation) return false;
                    }

                    return true;
                }))
                .catch((error: Error) => {
                    reject(error);
                    return false;
                });
            })
            .start(() => {
                rulesets = this.calculateRulesetValidityInterval(rulesets);
                resolve({rulesAtMoment: rulesets, confirmedVotes: confirmedVotes});
            });
        });
    }

    private calculateRulesetValidityInterval = (rulesets: RulesetsAtMoment []) => {
        rulesets.sort((a, b) => {
            if (a.opNum.isLesserThan(b.opNum))
                return -1;
            if (a.opNum.isGreaterThan(b.opNum))
                return 1;
            return 0;
        });
        for (let i = 0; i < rulesets.length; i++) {
            if (i + 1 < rulesets.length)
                rulesets[i].validityUntil = rulesets[i + 1].opNum;
            else
                rulesets[i].validityUntil = new SteemOperationNumber(Infinity, Infinity, Infinity);
        }
        return rulesets;
    }

    private loadVoteorders = (input: {rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment []}): Promise<{rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [], voteorders: VoteorderAtMoment []}> => {
        const voters: string [] = [];
        const votersLookupSince: SteemOperationNumber [] = [];

        this.proggressCallback("Loading new voteorders from voters you delegated to", 0.2);

        for (let i = 0; i < input.rulesAtMoment.length; i++) {
            const rulesetsAtMoment = input.rulesAtMoment[i];
            for (let j = 0; j < rulesetsAtMoment.rulesets.length; j ++) {
                const ruleset = rulesetsAtMoment.rulesets[j];
                if (voters.indexOf(ruleset.voter) !== -1) {
                    const index = voters.indexOf(ruleset.voter);
                    if (rulesetsAtMoment.opNum.isLesserThan(votersLookupSince[index])) votersLookupSince[index] = rulesetsAtMoment.opNum;
                }
                else {
                    voters.push(ruleset.voter);
                    votersLookupSince.push(rulesetsAtMoment.opNum);
                }
            }
        }

        const loaders: (() => Promise<VoteorderAtMoment[]>) [] = [];
        for (let i = 0; i < voters.length; i++) {
            loaders.push(() => { return this.loadUserVoteorders(voters[i], votersLookupSince[i]); });
        }

        return Promise.map(loaders, (loader: () => Promise<VoteorderAtMoment[]>) => { return loader(); }, { concurrency: this.concurrency }).then(
            (value: {}[]): {rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [], voteorders: VoteorderAtMoment []} => {
                const voteorders: VoteorderAtMoment [] = [];
                for (let i = 0; i < value.length; i++) {
                    const userVoteorders = value[i] as VoteorderAtMoment [];
                    for (let j = 0; j < userVoteorders.length; j++) {
                        voteorders.push(userVoteorders[j]);
                    }
                }
                return {confirmedVotes: input.confirmedVotes, rulesAtMoment: input.rulesAtMoment, voteorders: voteorders};
            }
        );
    }

    private loadUserVoteorders = (voter: string, lookupSince: SteemOperationNumber): Promise<VoteorderAtMoment[]> => {
        this.proggressCallback("Loading voteorders from " + voter + "...", 0.4);

        const voteorders: VoteorderAtMoment [] = [];
        return new Promise((resolve, reject) => {
            new AccountHistorySupplier(this.steem, voter)
            .branch((historySupplier) => {
                historySupplier
                .chain(new OperationNumberFilter("<_solveOpInTrxBug", this.beforeMoment))
                .chain(new OperationNumberLimiter(">=", lookupSince))
                .chain(new SmartvotesFilter())
                .chain(new BiTransformer())
                .chain(new SimpleTaker((item: {rawOp: RawOperation, op: smartvotes_operation}): boolean => {
                    if (item.op.name === "send_voteorder") {
                        voteorders.push({
                            voter: voter,
                            voteorder: item.op.voteorder,
                            opNum: SteemOperationNumber.fromOperation(item.rawOp),
                            transactionId: item.rawOp[1].trx_id
                        });
                    }

                    return true;
                }))
                .catch((error: Error) => {
                    reject(error);
                    return false;
                });
            })
            .start(() => {
                this.proggressCallback("Done loading voteorders from " + voter + ".", 0.4);
                resolve(voteorders);
            });
        });
    }

    private removeAlreadyConfirmedVotes = (input: {rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
                voteorders: VoteorderAtMoment []}): Promise<{rulesAtMoment: RulesetsAtMoment [],
                confirmedVotes: VoteConfirmedAtMoment [], voteorders: VoteorderAtMoment []}> => {
        return new Promise((resolve, reject) => {
            const unsyncedVoteorders: VoteorderAtMoment [] = [];
            for (let i = 0; i < input.voteorders.length; i++) {
                const voteorder = input.voteorders[i];
                let unsynced = true;
                for (let j = 0; j < input.confirmedVotes.length; j++) {
                    const confirmedVote = input.confirmedVotes[j];
                    if (!confirmedVote) throw new Error("Undefined or null confirmed vote in array");
                    if (voteorder.transactionId === confirmedVote.voteorderTransactionId && voteorder.opNum.operationNum === confirmedVote.voteorderOperationNum) {
                        unsynced = false;
                        break;
                    }
                }
                if (unsynced) unsyncedVoteorders.push(voteorder);
            }

            resolve({voteorders: unsyncedVoteorders, rulesAtMoment: input.rulesAtMoment, confirmedVotes: input.confirmedVotes});
        });
    }

    private sortVoteordersFromOldestToNewest = (input: {rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
            voteorders: VoteorderAtMoment []}): Promise<{rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
            voteorders: VoteorderAtMoment []}> => {
        return new Promise((resolve, reject) => {
            const voteorders = input.voteorders; // there is no need to copy them (just sort)
            voteorders.sort((a, b): number => {
                if (a.opNum.isEqual_solveOpInTrxBug(b.opNum)) return 0;
                else return  a.opNum.isGreaterThan(b.opNum) ? 1 : -1;
            });

            resolve({voteorders: voteorders, rulesAtMoment: input.rulesAtMoment, confirmedVotes: input.confirmedVotes});
        });
    }

    /* // this complicated voteorder confirmation, so i disable it now
    private removeDuplicateVoteorders = (input: {rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
        voteorders: VoteorderAtMoment []}): Promise<{rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
        voteorders: VoteorderAtMoment []}> => {
        return new Promise((resolve, reject) => {
            const cleanedVoteorders: VoteorderAtMoment [] = []; // there is no need to copy them (just sort)
            for (let i = 0; i < input.voteorders.length; i++) {
                const voteorderCandidate = input.voteorders[i];
                let duplicate = false;
                for (let j = 0; j < cleanedVoteorders.length; j++) {
                    const potentiallyDuplicated = cleanedVoteorders[j];
                    if (potentiallyDuplicated.voteorder.author === voteorderCandidate.voteorder.author
                        && potentiallyDuplicated.voteorder.permlink === voteorderCandidate.voteorder.permlink) {
                            duplicate = true;
                            cleanedVoteorders.splice(j, 1); // ensure only the newest voteorder for the post is used (that is why we remove older one).
                            cleanedVoteorders.push(voteorderCandidate);
                        }
                }
                if (!duplicate) cleanedVoteorders.push(voteorderCandidate);
            }

            resolve({voteorders: cleanedVoteorders, rulesAtMoment: input.rulesAtMoment, confirmedVotes: input.confirmedVotes});
        });
    }
    */

    private validate = (input: {rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
            voteorders: VoteorderAtMoment []}): Promise<SynchronizationResult> => {

        this.proggressCallback("Loaded all voteorders, validating...", 0.6);

        const validatorPromiseReturners: (() => Promise<{voteorder: VoteorderAtMoment, error: string|undefined}>) [] = [];

        for (let i = 0; i < input.voteorders.length; i++) {
            const voteorder = input.voteorders[i];
            validatorPromiseReturners.push(() => {
                return this.validateSingleVoteorder(voteorder, input.rulesAtMoment);
            });
        }

        return Promise.map(validatorPromiseReturners, (returner: () => Promise<boolean[]>) => { return returner(); }, { concurrency: this.concurrency })
        .then((values: (any | undefined) []): {rulesAtMoment: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
            validVoteorders: VoteorderAtMoment [], invalidVoteorders: [VoteorderAtMoment, string][]} => {
            const validVoteorders: VoteorderAtMoment [] = [];
            const invalidVoteorders: [VoteorderAtMoment, string][] = [];

            for (let i = 0; i < values.length; i++) {
                const value: {voteorder: VoteorderAtMoment, error: string|undefined} = values[i] as {voteorder: VoteorderAtMoment, error: string|undefined};

                if (value.error === undefined) {
                    validVoteorders.push(value.voteorder);
                }
                else {
                    invalidVoteorders.push([value.voteorder, value.error]);
                }
            }
            return {rulesAtMoment: input.rulesAtMoment, confirmedVotes: input.confirmedVotes, validVoteorders: validVoteorders, invalidVoteorders: invalidVoteorders};
         })
         .catch(error => { throw error; });
    }

    private validateSingleVoteorder = (voteorder: VoteorderAtMoment, rulesAtMoment: RulesetsAtMoment []): Promise<{voteorder: VoteorderAtMoment, error: string|undefined}> => {
        return new Promise((resolve, reject) => {
            if (!voteorder) throw new Error("Got undefined voteorder for validation");
            this.proggressCallback("Starting validation of @" + voteorder.voter + ": /@" + voteorder.voteorder.author + "/" + voteorder.voteorder.permlink, 0.6);

            new RulesValidator(this.steem)
            .withConcurrency(1/* because synchronization is already concurrent*/)
            .provideRulesetsForValidation(rulesAtMoment)
            .validateVoteOrder(voteorder.voter, voteorder.voteorder, voteorder.opNum, (error: Error | undefined, result: boolean) => {
                if (error && (<ValidationError>error).validationError) {
                    this.proggressCallback("Validation "
                        + " failed for voteorder of @" + voteorder.voter + ": /@" + voteorder.voteorder.author + "/" + voteorder.voteorder.permlink + "; error: " + error.message, 0.6);
                    resolve({voteorder: voteorder, error: error.message});
                }
                else if (error) {
                    reject(error);
                }
                else if (result) {
                    this.proggressCallback("Validation "
                        + " succeeded for voteorder of @" + voteorder.voter + ": /@" + voteorder.voteorder.author + "/" + voteorder.voteorder.permlink + "", 0.6);
                     resolve({voteorder: voteorder, error: undefined});
                }
                else throw new Error("Invalid voteorder, but no error");
            });
         });
    }

    private vote = (input: SynchronizationResult): Promise<SynchronizationResult> => {
        if (input.validVoteorders.length == 0) return new Promise((resolve, reject) => {
            this.proggressCallback("Nothing to synchronize", 1.0);
            resolve();
        });

        const operations: (["custom_json", CustomJsonOperation] | ["vote", VoteOperation]) [] = [];
        const voteConfirmations: { transaction_id: string, operation_num: number, invalid: boolean } [] = [];

        for (let i = 0; i < input.validVoteorders.length; i++) {
            const voteorder = input.validVoteorders[i];

            const voteOp: VoteOperation = {
                voter: this.username,
                author: voteorder.voteorder.author,
                permlink: voteorder.voteorder.permlink,
                weight: (voteorder.voteorder.weight * (voteorder.voteorder.type === "flag" ? -1 : 1)),
            };
            operations.push(["vote", voteOp]);
            voteConfirmations.push({transaction_id: voteorder.transactionId, operation_num: voteorder.opNum.operationNum, invalid: false});
        }

        for (let i = 0; i < input.invalidVoteorders.length; i++) {
            const voteorder = input.invalidVoteorders[i];
            voteConfirmations.push({transaction_id: voteorder[0].transactionId, operation_num: voteorder[0].opNum.operationNum, invalid: true});
        }

        const confirmationOp: smartvotes_command_confirm_votes = {
            name: "confirm_votes",
            voteorders: voteConfirmations
        };

        const customJsonOp: CustomJsonOperation = {
            required_auths: [],
            required_posting_auths: [this.username],
            id: "smartvote",
            json: JSON.stringify(confirmationOp)
        };
        operations.push(["custom_json", customJsonOp]);

        console.log(JSON.stringify(operations, undefined, 2));

        return new Promise((resolve, reject) => {
            this.proggressCallback("Sending votes... ", 0.9);
            this.steem.broadcast.send(
                {
                    extensions: [],
                    operations: operations
                },
                {posting: this.postingWif},
                (error: Error, result: any) => {
                    if (error) reject(error);
                    else {
                        this.proggressCallback("Synchronization done", 1.0);
                        resolve(input);
                    }
                }
            );
        });
    }
}