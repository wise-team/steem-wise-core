import * as _log from "loglevel"; const log = _log.getLogger("steem-wise-core");

/* tslint:disable no-null-keyword */
export class Util {
    public static objectAssign (target: object, ...varArgs: object []) { // .length of function is 2
        "use strict";
        if (target == null) { // TypeError if undefined or null
        throw new TypeError("Cannot convert undefined or null to object");
        }
        const to = Object(target);

        for (let index = 1; index < arguments.length; index++) {
            const nextSource = arguments[index];

            if (nextSource != null) { // Skip over if undefined or null
                for (const nextKey in nextSource) {
                    // Avoid bugs when hasOwnProperty is shadowed
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    }

    public static definedOrThrow = <T> (input: T | undefined, error: Error = new Error("Undefined (Util.definedOrThrow)")): T => {
        if (input) return input;
        else throw error;
    };

    public static cheapDebug(debugStringReturnerFn: () => string): void {
        if (log.getLevel() <= log.levels.DEBUG) log.debug(debugStringReturnerFn());
    }

    public static promiseResolveDebug<T>(msgBeginning: string, result: T): T {
        Util.cheapDebug(() => msgBeginning + JSON.stringify(result));
        return result;
    }

    public static promiseRejectionDebug<T>(msgBeginning: string, error: T): T {
        Util.cheapDebug(() => msgBeginning + JSON.stringify(error));
        throw error;
    }
}