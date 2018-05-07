import { Promise } from "bluebird";
import { AccountHistorySupplier, SmartvotesFilter, OperationNumberFilter, SimpleTaker,
    ToSmartvotesOperationTransformer, SmartvotesOperationTypeFilter,
    ChainableLimiter, BiTransformer, OperationTypeFilter, OperationNumberLimiter } from "./chainable/_exports";
import { smartvotes_operation, smartvotes_command_set_rules, smartvotes_voteorder, smartvotes_ruleset } from "./schema/smartvotes.schema";
import { RawOperation } from "./types/blockchain-operations-types";
import { _objectAssign } from "./util";
import { SteemOperationNumber } from "./blockchain/SteemOperationNumber";

interface BeforeSyncData1 {
    rulesets: {
        tn: SteemOperationNumber,
        ruleset: smartvotes_ruleset,
        validityUntil: SteemOperationNumber
    } [];
    confirmedVotes: {
        tn: SteemOperationNumber,
        voteorderTransactionId: string
    } [];
}

/*interface BeforeSyncData2 extends BeforeSyncData1 {
    oldestTn: TransactionNumber;
}*/

interface BeforeSyncData2 extends BeforeSyncData1 {
    voteorders: {
        tn: SteemOperationNumber,
        voter: string,
        voteorder: smartvotes_voteorder
    } [];
}

// TODO move to /blockchain
export class Synchronizer {
    private steem: any;
    private username: string;
    private postingWif: string;
    private proggressCallback: (msg: string, proggress: number) => void = (msg, proggress) => {};

    constructor(steem: any, username: string, postingWif: string) {
        this.steem = steem;
        this.username = username;
        this.postingWif = postingWif;
    }

    public withProggressCallback(proggressCallback: (msg: string, proggress: number) => void) {
        this.proggressCallback = proggressCallback;
    }

    public synchronize = (callback: (error: Error | undefined) => void, ): void => {
        this.proggressCallback("Loading rulesets since last synchronized voteorder", 0);

        this.loadUnsynchronizedOperations()
        .then((input: any) => { this.proggressCallback("Loading new voteorders from voters you delegated to", 0.2); return input; })
        .then(this.loadVoteorders)
        .then((input: any) => { this.proggressCallback("Loaded all voteorders, validating...", 0.6); return input; })
        .then(this.validateVoteorders)
        .then((input: any) => { callback(undefined); })
        .catch((error: Error) => callback(error));
    }

    private loadUnsynchronizedOperations = (): Promise<BeforeSyncData1> => {
        return new Promise((resolve, reject) => {
            let rulesets: {tn: SteemOperationNumber, ruleset: smartvotes_ruleset, validityUntil: SteemOperationNumber} [] = [];
            const confirmedVotes: {tn: SteemOperationNumber, voteorderTransactionId: string} [] = [];

            let foundVoteConfirmation = false;
            new AccountHistorySupplier(this.steem, this.username)
            .branch((historySupplier) => {
                historySupplier
                .chain(new SmartvotesFilter())
                .chain(new BiTransformer())
                .chain(new SimpleTaker((item: {rawOp: RawOperation, op: smartvotes_operation}): boolean => {
                    if (item.op.name === "confirm_vote") {
                        confirmedVotes.push({
                            tn: SteemOperationNumber.fromOperation(item.rawOp),
                            voteorderTransactionId: item.op.transaction_id
                        });
                        foundVoteConfirmation = true;
                    }
                    else if (item.op.name === "set_rules") {
                        for (let i = 0; i < item.op.rulesets.length; i++) {
                            const ruleset = item.op.rulesets[i];
                            rulesets.push({
                                tn: SteemOperationNumber.fromOperation(item.rawOp),
                                ruleset: ruleset,
                                validityUntil: new SteemOperationNumber(Infinity, Infinity, Infinity)
                            });
                        }
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
                resolve({rulesets: rulesets, confirmedVotes: confirmedVotes});
            });
        });
    }

    private calculateRulesetValidityInterval = (rulesets: {tn: SteemOperationNumber, ruleset: smartvotes_ruleset, validityUntil: SteemOperationNumber} []): {tn: SteemOperationNumber, ruleset: smartvotes_ruleset, validityUntil: SteemOperationNumber} [] => {
        rulesets.sort((a, b) => {
            if (a.tn.isLesserThan(b.tn))
                return -1;
            if (a.tn.isGreaterThan(b.tn))
                return 1;
            return 0;
        });
        for (let i = 0; i < rulesets.length; i++) {
            if (i + 1 < rulesets.length)
                rulesets[i].validityUntil = rulesets[i + 1].tn;
            else
                rulesets[i].validityUntil = new SteemOperationNumber(Infinity, Infinity, Infinity);
        }
        return rulesets;
    }

    /*private calculateOldestTransactionNumber = (input: BeforeSyncData1): Promise<BeforeSyncData2> => {
        return new Promise((resolve, reject) => {
            let oldest: TransactionNumber | undefined = undefined;
            if (input.confirmedVotes.length > 0) {
                for (let i = 0; i < input.confirmedVotes.length; i++) {
                    const tn = input.confirmedVotes[i].tn;
                    if (!oldest || tn.isSmallerThan(oldest)) oldest = tn;
                }
            }
            else {
                for (let i = 0; i < input.rulesets.length; i++) {
                    const tn = input.rulesets[i].tn;
                    if (!oldest || tn.isSmallerThan(oldest)) oldest = tn;
                }
            }

            if (!oldest) oldest = new TransactionNumber(0, 0);

            resolve({rulesets: input.rulesets, confirmedVotes: input.confirmedVotes, oldestTn: oldest});
        });
    }*/

    private loadVoteorders = (input: BeforeSyncData1): Promise<BeforeSyncData2> => {
        const voters: string [] = [];
        const votersLookupSince: SteemOperationNumber [] = [];

        for (let i = 0; i < input.rulesets.length; i++) {
            const ruleset = input.rulesets[i];
            if (voters.indexOf(ruleset.ruleset.voter) !== -1) {
                const index = voters.indexOf(ruleset.ruleset.voter);
                if (ruleset.tn.isLesserThan(votersLookupSince[index])) votersLookupSince[index] = ruleset.tn;
            }
            else {
                voters.push(ruleset.ruleset.voter);
                votersLookupSince.push(ruleset.tn);
            }
        }

        const promises: Promise<{voter: string, voteorder: smartvotes_voteorder, tn: SteemOperationNumber}[]> [] = [];
        for (let i = 0; i < voters.length; i++) {
            promises.push(this.loadUserVoteorders(voters[i], votersLookupSince[i]));
        }

        return Promise.all(promises).then(
            (value: {}[]): BeforeSyncData2 => {
                const voteorders: {tn: SteemOperationNumber, voter: string, voteorder: smartvotes_voteorder} [] = [];
                for (let i = 0; i < value.length; i++) {
                    const voteorder = value[i] as {tn: SteemOperationNumber, voter: string, voteorder: smartvotes_voteorder};
                    voteorders.push(voteorder);
                }
                return {confirmedVotes: input.confirmedVotes, rulesets: input.rulesets, voteorders: voteorders};
            }
        );
    }

    private loadUserVoteorders = (voter: string, lookupSince: SteemOperationNumber): Promise<{voter: string, voteorder: smartvotes_voteorder, tn: SteemOperationNumber}[]> => {
        this.proggressCallback("Loading voteorders from " + voter + "...", 0.4);

        const voteorders: {voter: string, voteorder: smartvotes_voteorder, tn: SteemOperationNumber} [] = [];
        return new Promise((resolve, reject) => {
            new AccountHistorySupplier(this.steem, voter)
            .branch((historySupplier) => {
                historySupplier
                .chain(new SmartvotesFilter())
                .chain(new OperationNumberLimiter(">=", lookupSince))
                .chain(new BiTransformer())
                .chain(new SimpleTaker((item: {rawOp: RawOperation, op: smartvotes_operation}): boolean => {
                    if (item.op.name === "send_voteorder") {
                        voteorders.push({voter: voter, voteorder: item.op.voteorder, tn: SteemOperationNumber.fromOperation(item.rawOp)});
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

    private validateVoteorders = (input: BeforeSyncData2): Promise<void> => {
        /* tslint:disable no-null-keyword  */
        return new Promise((resolve, reject) => {
            console.log("Loaded: ");
            console.log(JSON.stringify(input, null, 2));

            resolve();
        });
    }
}