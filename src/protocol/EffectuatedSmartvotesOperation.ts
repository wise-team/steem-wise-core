import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { SmartvotesOperation } from "./SmartvotesOperation";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";

// TODO rename all Smartvotes to WISE
export interface EffectuatedSmartvotesOperation extends SmartvotesOperation {
    moment: SteemOperationNumber;
    transaction_id: string;
    timestamp: Date;
}