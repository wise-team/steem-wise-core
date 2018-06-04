import * as _ from "lodash";

/**
 * Thanks to authors of https://github.com/wesleytodd/setprototypeof/blob/master/index.js
 * Unfortunetely due to unsupported export type it could not be longer used as a dependency. Sorry.
 */
export const setPrototypeOf = _.get(Object, "setPrototypeOf") || ({__proto__: []} instanceof Array ? setProtoOf : mixinProperties);

function setProtoOf(obj: { [x: string]: any; }, proto: { [x: string]: any; }) {
    obj.__proto__ = proto;
    return obj;
}

function mixinProperties(obj: { [x: string]: any; }, proto: { [x: string]: any; }) {
    for (const prop in proto) {
        if (!obj.hasOwnProperty(prop)) {
            obj[prop] = proto[prop];
        }
    }
    return obj;
}