import { WiseOperation } from "./WiseOperation";
import { SteemOperationNumber } from "steem-efficient-stream";

export interface EffectuatedWiseOperation extends WiseOperation {
    moment: SteemOperationNumber;
    transaction_id: string;
    timestamp: Date;
}
