import ow from "ow";
import * as steem from "steem";
import { CustomError } from "../util/CustomError";

export interface SteemAdapter {
    getAccountHistoryAsync(username: string, from: number, limit: number): Promise<steem.AccountHistory.Operation[]>;
}

export namespace SteemAdapter {
    export function isSteemAdapter(o: any): o is SteemAdapter {
        return (<SteemAdapter>o).getAccountHistoryAsync !== undefined;
    }

    export interface Options {
        url: string;
    }

    export namespace Options {
        export function validate(o: Options) {
            ow(o.url, "SteemAdapter.Options.url", ow.string.nonEmpty);
        }
    }

    export class SteemError extends CustomError {
        public constructor(message?: string, cause?: Error) {
            super(message, cause);
        }
    }
}
