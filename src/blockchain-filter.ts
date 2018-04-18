const steem = require("steem");

import { RawOperation, CustomJsonOperation } from "./blockchain-operations-types";

export function getSmartvotesOperationsOfUser(username: string, callback: (error: Error, result: CustomJsonOperation []) => void): void {
    filterHistoryRange(username, -1, 1000, [], callback);
}

function filterHistoryRange(username: string, from: number, limit: number, recentOps: CustomJsonOperation [], callback: (error: Error, result: CustomJsonOperation []) => void) {
    steem.api.getAccountHistory(username, from, limit, function(error: Error, result: any) {
        if (error) callback(error, []);
        else {
            if (result.length == 0) {
                callback(error, recentOps);
            }
            else {
                const resultFiltered: CustomJsonOperation [] = filterOps(result);
                recentOps = resultFiltered.concat(recentOps);

                if (result.length < 1000) { // all operations were loaded
                    callback(error, recentOps);
                }
                else { // if length == 1000 -> there are more ops to load
                    const from = result[0][0] - 1; // absolute number of oldest loaded operation, minus one
                    filterHistoryRange(username, from, 1000, recentOps, callback);
                }
            }
        }
    });
}


function filterOps(rawOps: RawOperation []): CustomJsonOperation [] {
    const out: CustomJsonOperation [] = [];

    for (const i in rawOps) {
        const rawOp: RawOperation = rawOps[i];
        if (rawOp[1].op[0] == "custom_json" && rawOp[1].op[1].id == "smartvote") {
            out.push(rawOp[1].op[1]);
        }
    }

    return out;
}