import { WiseOperation } from "./WiseOperation";
import { SteemOperationNumber } from "../blockchain/SteemOperationNumber";

export interface EffectuatedWiseOperation extends WiseOperation {
    moment: SteemOperationNumber;
    transaction_id: string;
    timestamp: Date;
}