import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import * as url from "url";
import * as _ from "lodash";
import { Log } from "../../util/Log";
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
                && typeof (<Row>o).id === "number"
                && typeof (<Row>o).block_num === "number"
                && typeof (<Row>o).transaction_num === "number"
                && typeof (<Row>o).transaction_id === "string"
                && typeof (<Row>o).timestamp === "string"
                && typeof (<Row>o).moment === "number"
                && typeof (<Row>o).voter === "string"
                && typeof (<Row>o).delegator === "string"
                && typeof (<Row>o).operation_type === "string"
                && ([ "set_rules", "send_voteorder", "confirm_vote" ].indexOf((<Row>o).operation_type) !== -1)
                && typeof (<Row>o).json_str === "string"
            ;
        }
    }

    export namespace Handler {
        export interface QueryParams {
            endpointUrl: string;
            path: string; method: "get" | "post";
            params?: object;
            data?: object;
            limit: number;
        }
    }

    export class Handler {
        public static async query(params: Handler.QueryParams, loadNextPages: boolean = true, offset: number = 0): Promise<EffectuatedWiseOperation []> {
            const queryConfig: AxiosRequestConfig = {};

            queryConfig.url =
                 params.endpointUrl
                 + ( params.endpointUrl.substr(-1) !== "/" && params.path.substr(0, 1) !== "/" ? "/" : "" )
                 + params.path;
            queryConfig.method = params.method;
            if (params.params) queryConfig.params = params.params;
            if (params.data) queryConfig.data = params.data;
            queryConfig.headers = {
                "Range-Unit": "items",
                "Range":  offset + "-" + (params.limit - 1)
            };

            Log.log().efficient(Log.level.http, () => "HTTP_REQUEST=" + JSON.stringify(queryConfig));
            const response = await axios(queryConfig);
            Log.log().efficient(Log.level.http, () => "HTTP_RESPONSE_HEADERS=" + JSON.stringify(response.headers));
            Log.log().efficient(Log.level.http, () => "HTTP_RESPONSE_DATA_LENGTH=" + JSON.stringify(response.data.length));

            if (!response.data) throw new Error("No response from server");
            if (!Array.isArray(response.data)) throw new Error("Malformed response from server");
            const protocolVersion = Handler.getProtocolVersionFromResponse(response);
            const out = response.data.map(row => Handler.handleRow(protocolVersion, row));

            if (loadNextPages && out.length > 0 && out.length + offset < params.limit) {
                const nextPageOffset = Handler.nextPageOffset(response); // this method decides if next page exists
                if (nextPageOffset > 0) {
                    const nextPageOut = await Handler.query(params, true, nextPageOffset);
                    nextPageOut.forEach(responseOp => out.push(responseOp));
                }
            }

            return out;
        }

        private static getProtocolVersionFromResponse(response: AxiosResponse): string {
            if (!response.headers["wisesql-protocol-version"]) throw new Error("Response is missing the \"wisesql-protocol-version\" header. Check if it is a wiseSQL endpoint.");
            return response.headers["wisesql-protocol-version"].trim();
        }

        private static nextPageOffset(response: AxiosResponse): number {
            if (!response.headers["content-range"]) throw new Error("Response is missing the \"content-range\" header. Check if it is a wiseSQL endpoint.");
            if (!response.headers["wisesql-max-rows-per-page"]) throw new Error("Response is missing the \"wisesql-max-rows-per-page\" header. Check if it is a wiseSQL endpoint.");

            const contentRangeStr = response.headers["content-range"].trim();
            const contentRangeRegExp: RegExp = /^([0-9]+)-?([0-9]*)\/?([0-9]*|\*)?$/giu;
            const matches = contentRangeRegExp.exec(contentRangeStr);
            if (!matches || matches.length < 3) throw new Error("Malformed content-range header: '" + contentRangeStr + "'");
            const offset: number = parseInt(matches[1], 10);
            const lastIndex: number = parseInt(matches[2], 10);

            if (matches.length > 3 && matches[3] !== "*") { // this is the case when the server sends the full length of db query result
                const fullLength = parseInt(matches[3], 10);
                if (!((lastIndex + 1) === fullLength)) {
                    return lastIndex + 1;
                }
            }
            else {
                const maxRowsPerPage = parseInt(response.headers["wisesql-max-rows-per-page"], 10);
                const resultLength = lastIndex - offset + 1 /* we calculate length thats why add 1 */;
                if (resultLength === maxRowsPerPage) {
                    return lastIndex + 1;
                }
            }
            return -1;
        }

        private static handleRow(protocolVersion: string, row: object): EffectuatedWiseOperation {
            if (protocolVersion !== "1.0") throw new Error("Unsupported protocol version " + protocolVersion + ". "
                + "Consider updating steem-wise-core lib or contact wise-team. This version supports only v1.0 protocol.");

            if (!Row.isRow(row)) throw new Error("Row is malformed: " + JSON.stringify(row));

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
