import { WiseCommand } from "./WiseCommand";

export interface WiseOperation {
    voter: string;
    delegator: string;
    command: WiseCommand;
}