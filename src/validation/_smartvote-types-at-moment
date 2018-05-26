import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";
import { smartvotes_ruleset, smartvotes_voteorder } from "../schema/smartvotes.schema";

// TODO comment
export interface VoteConfirmedAtMoment {
    opNum: SteemOperationNumber;
    voteorderTransactionId: string;
    voteorderOperationNum: number;
}

export interface RulesetsAtMoment {
    opNum: SteemOperationNumber;
    rulesets: smartvotes_ruleset [];
    validityUntil: SteemOperationNumber;
}

export interface VoteorderAtMoment {
    transactionId: string;
    opNum: SteemOperationNumber;
    voter: string;
    voteorder: smartvotes_voteorder;
}