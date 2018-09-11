import { SetRules } from "./SetRules";
import { SendVoteorder } from "./SendVoteorder";
import { WiseOperation } from "./WiseOperation";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";

// TODO rename all Smartvotes to WISE
export interface EffectuatedWiseOperation extends WiseOperation {
    moment: SteemOperationNumber;
    transaction_id: string;
    timestamp: Date;
}