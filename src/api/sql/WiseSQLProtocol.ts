import { EffectuatedWiseOperation } from "../../protocol/EffectuatedWiseOperation";
import { WiseCommand } from "../../protocol/WiseCommand";
import { SteemOperationNumber } from "../../blockchain/SteemOperationNumber";

export namespace WiseSQLProtocol {
    export interface Row {
        id: number;
        block_num: number;
        transaction_num: number;
        transaction_id: string;
        timestamp: string;
        moment: number;
        voter: string;
        delegator: string;
        operation_type: "set_rules" | "send_voteorder" | "confirm_vote";
        json_str: string;
    }

    export namespace Row {
        /**
         * This is an TS 1.6+ TypeGuard as described here: https://www.typescriptlang.org/docs/handbook/advanced-types.html
         */
        export function isRow(o: any): o is Row {
            return typeof o === "object"
                && (<Row>o).id !== undefined && typeof o.id === "number"
                && (<Row>o).block_num !== undefined && typeof o.block_num === "number"
                && (<Row>o).transaction_num !== undefined && typeof o.transaction_num === "number"
                && (<Row>o).transaction_id !== undefined && typeof o.transaction_id === "string"
                && (<Row>o).timestamp !== undefined && typeof o.timestamp === "number"
                && (<Row>o).moment !== undefined && typeof o.moment === "number"
                && (<Row>o).voter !== undefined && typeof o.voter === "string"
                && (<Row>o).block_num !== undefined && typeof o.block_num === "string"
                && (<Row>o).delegator !== undefined && typeof o.delegator === "string"
                && (<Row>o).operation_type !== undefined && typeof o.operation_type === "string"
                && ([ "set_rules", "send_voteorder", "confirm_vote" ].indexOf((<Row>o).operation_type) !== -1)
                && (<Row>o).json_str !== undefined && typeof o.json_str === "string"
            ;
        }
    }

    export class Handler {
        public static handleRow(protocolVersion: string, row: object): EffectuatedWiseOperation {
            if (protocolVersion !== "1.0") throw new Error("Unsupported protocol version " + protocolVersion + ". "
                + "Consider updating steem-wise-core lib or contact wise-team. This version supports only v1.0 protocol.");

            if (!Row.isRow(row)) throw new Error("Row is malformed");

            const cmd = JSON.parse(row.json_str);
            if (!WiseCommand.isWiseCommand(cmd)) throw new Error("Malformed WiseCommand object in row.json_str");

            const out: EffectuatedWiseOperation = {
                command: cmd,
                moment: new SteemOperationNumber(row.block_num, row.transaction_num, 0),
                transaction_id: row.transaction_id,
                timestamp: new Date(row.timestamp),
                voter: row.voter,
                delegator: row.delegator
            };
            return out;
        }
    }
}
