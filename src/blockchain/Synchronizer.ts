import { Promise } from "bluebird";
import { AccountHistorySupplier, SmartvotesFilter, OperationNumberFilter, SimpleTaker,
    ToSmartvotesOperationTransformer, SmartvotesOperationTypeFilter,
    ChainableLimiter, BiTransformer, OperationTypeFilter, OperationNumberLimiter } from "../chainable/_exports";
import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_ruleset } from "../schema/smartvotes.schema";
import { RawOperation } from "../blockchain/blockchain-operations-types";
import { _objectAssign } from "../util/util";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { RulesValidator } from "../validation/RulesValidator";
import { VoteConfirmedAtMoment, VoteorderAtMoment, RulesetsAtMoment } from "../validation/smartvote-types-at-moment";
import { ValidationError } from "../validation/ValidationError";

/*interface BeforeSyncData1 {
    rulesets: RulesetAtMoment [];
    confirmedVotes: VoteConfirmedAtMoment [];
}

interface BeforeSyncData2 extends BeforeSyncData1 {
    voteorders: VoteorderAtMoment [];
}*/

export class Synchronizer {
    private steem: any;
    private username: string;
    private postingWif: string;
    private proggressCallback: (msg: string, proggress: number) => void = (msg, proggress) => {};
    private validateOnly: boolean = false;
    private concurrency: number = 4;

    constructor(steem: any, username: string, postingWif: string) {
        this.steem = steem;
        this.username = username;
        this.postingWif = postingWif;
    }

    public withProggressCallback(proggressCallback: (msg: string, proggress: number) => void) {
        this.proggressCallback = proggressCallback;
    }

    public withValidateOnly(validateOnly: boolean): Synchronizer {
        this.validateOnly = validateOnly;
        return this;
    }

    public withConcurrency(concurrency: number): Synchronizer {
        this.concurrency = concurrency;
        return this;
    }

    public synchronize = (callback: (error: Error | undefined, result: VoteorderAtMoment [] | undefined) => void, ): void => {
        this.proggressCallback("Loading rulesets since last synchronized voteorder", 0);

        this.loadUnsynchronizedOperations()
        .then(this.loadVoteorders)
        .then(this.removeAlreadyConfirmedVotes)
        .then(this.sortVoteordersFromOldestToNewest)
        .then(this.removeDuplicateVoteorders)
        .then(this.validate)
        .then((input: VoteorderAtMoment []) => {
            if (this.validateOnly) return input;
            else return this.vote(input);
        })
        .then((input: VoteorderAtMoment []) => { callback(undefined, input); })
        .catch((error: Error) => callback(error, undefined));
    }

    private loadUnsynchronizedOperations = (): Promise<{rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment []}> => {
        return new Promise((resolve, reject) => {
            let rulesets: RulesetsAtMoment [] = [];
            const confirmedVotes: VoteConfirmedAtMoment [] = [];

            let foundVoteConfirmation = false;
            let previousRulesetOpNum = new SteemOperationNumber(Infinity, Infinity, Infinity);

            new AccountHistorySupplier(this.steem, this.username)
            .branch((historySupplier) => {
                historySupplier
                .chain(new SmartvotesFilter())
                .chain(new BiTransformer())
                .chain(new SimpleTaker((item: {rawOp: RawOperation, op: smartvotes_operation}): boolean => {
                    if (item.op.name === "confirm_vote") {
                        confirmedVotes.push({
                            opNum: SteemOperationNumber.fromOperation(item.rawOp),
                            voteorderTransactionId: item.op.transaction_id
                        });
                        foundVoteConfirmation = true;
                    }
                    else if (item.op.name === "set_rules") {
                        rulesets.push({ // TODO bug: ruleset should be invalidated only by new set_rules command (not by other ruleset from the same family)
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
                resolve({rulesetsAtMomentArr: rulesets, confirmedVotes: confirmedVotes});
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

    private loadVoteorders = (input: {rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment []}): Promise<{rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [], voteorders: VoteorderAtMoment []}> => {
        const voters: string [] = [];
        const votersLookupSince: SteemOperationNumber [] = [];

        this.proggressCallback("Loading new voteorders from voters you delegated to", 0.2);

        for (let i = 0; i < input.rulesetsAtMomentArr.length; i++) {
            const rulesetsAtMoment = input.rulesetsAtMomentArr[i];
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
            (value: {}[]): {rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [], voteorders: VoteorderAtMoment []} => {
                const voteorders: VoteorderAtMoment [] = [];
                for (let i = 0; i < value.length; i++) {
                    const userVoteorders = value[i] as VoteorderAtMoment [];
                    for (let j = 0; j < userVoteorders.length; j++) {
                        voteorders.push(userVoteorders[j]);
                    }
                }
                return {confirmedVotes: input.confirmedVotes, rulesetsAtMomentArr: input.rulesetsAtMomentArr, voteorders: voteorders};
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
                .chain(new SmartvotesFilter())
                .chain(new OperationNumberLimiter(">=", lookupSince))
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

    private removeAlreadyConfirmedVotes = (input: {rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
                voteorders: VoteorderAtMoment []}): Promise<{rulesetsAtMomentArr: RulesetsAtMoment [],
                confirmedVotes: VoteConfirmedAtMoment [], voteorders: VoteorderAtMoment []}> => {
        return new Promise((resolve, reject) => {
            const unsyncedVoteorders: VoteorderAtMoment [] = [];

            for (let i = 0; i < input.voteorders.length; i++) {
                const voteorder = input.voteorders[i];
                let unsynced = true;
                for (let j = 0; i < input.confirmedVotes.length; j++) {
                    const confirmedVote = input.confirmedVotes[j];
                    if (voteorder.transactionId === confirmedVote.voteorderTransactionId) {
                        unsynced = false;
                        break;
                    }
                }
                if (unsynced) unsyncedVoteorders.push(voteorder);
            }

            resolve({voteorders: unsyncedVoteorders, rulesetsAtMomentArr: input.rulesetsAtMomentArr, confirmedVotes: input.confirmedVotes});
        });
    }

    private sortVoteordersFromOldestToNewest = (input: {rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
            voteorders: VoteorderAtMoment []}): Promise<{rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
            voteorders: VoteorderAtMoment []}> => {
        return new Promise((resolve, reject) => {
            const voteorders = input.voteorders; // there is no need to copy them (just sort)
            voteorders.sort((a, b): number => {
                return a.opNum.isGreaterThan(b.opNum) ? -1 : a.opNum.isLesserThan(b.opNum) ? 1 : 0;
            });

            resolve({voteorders: voteorders, rulesetsAtMomentArr: input.rulesetsAtMomentArr, confirmedVotes: input.confirmedVotes});
        });
    }

    private removeDuplicateVoteorders = (input: {rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
        voteorders: VoteorderAtMoment []}): Promise<{rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
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

            resolve({voteorders: cleanedVoteorders, rulesetsAtMomentArr: input.rulesetsAtMomentArr, confirmedVotes: input.confirmedVotes});
        });
    }

    private validate = (input: {rulesetsAtMomentArr: RulesetsAtMoment [], confirmedVotes: VoteConfirmedAtMoment [],
            voteorders: VoteorderAtMoment []}): Promise<VoteorderAtMoment []> => {

        this.proggressCallback("Loaded all voteorders, validating...", 0.6);

        const validatorPromiseReturners: (() => Promise<VoteorderAtMoment|undefined>) [] = [];

        for (let i = 0; i < input.voteorders.length; i++) {
            const voteorder = input.voteorders[i];
            validatorPromiseReturners.push(() => {
                return this.validateSingleVoteorder(voteorder, input.rulesetsAtMomentArr);
            });
        }

        return Promise.map(validatorPromiseReturners, (returner: () => Promise<boolean[]>) => { return returner(); }, { concurrency: this.concurrency })
        .then((values: (any | undefined) []): VoteorderAtMoment [] => {
            const out: VoteorderAtMoment [] = [];
            for (let i = 0; i < values.length; i++) {
                const value: any = values[i];
                if (value !== undefined) {
                    out.push(value as VoteorderAtMoment);
                }
            }
            return out;
         })
         .catch(error => { throw error; });
    }

    private validateSingleVoteorder = (voteorder: VoteorderAtMoment, rulesetsAtMomentArr: RulesetsAtMoment []): Promise<VoteorderAtMoment|undefined> => {
        return new Promise((resolve, reject) => {
            if (!voteorder) throw new Error("Got undefined voteorder for validation");
            this.proggressCallback("Starting validation of @" + voteorder.voter + ": /@" + voteorder.voteorder.author + "/" + voteorder.voteorder.permlink, 0.6);

            new RulesValidator(this.steem)
            .withConcurrency(1/* because synchronization is already concurrent*/)
            .provideRulesetsForValidation(rulesetsAtMomentArr)
            .validateVoteOrder(voteorder.voter, voteorder.voteorder, voteorder.opNum, (error: Error | undefined, result: boolean) => {
                if (error && (<ValidationError>error).validationError) {
                    this.proggressCallback("Validation "
                        + " failed for voteorder of @" + voteorder.voter + ": /@" + voteorder.voteorder.author + "/" + voteorder.voteorder.permlink + "; error: " + error.message, 0.6);
                    resolve(undefined);
                }
                else if (error) {
                    reject(error);
                }
                else if (result) {
                    this.proggressCallback("Validation "
                        + " succeeded for voteorder of @" + voteorder.voter + ": /@" + voteorder.voteorder.author + "/" + voteorder.voteorder.permlink + "", 0.6);
                     resolve(voteorder);
                }
                else throw new Error("Invalid voteorder, but no error");
            });
         });
    }

    private vote = (voteorders: VoteorderAtMoment []): Promise<VoteorderAtMoment []> => {
        throw new Error("Unsupported operation");
    }
}