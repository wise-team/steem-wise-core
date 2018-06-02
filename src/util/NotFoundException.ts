import setPrototypeOf = require("setprototypeof");


export class NotFoundException extends Error {
    public notFoundException: true = true;

    constructor(m: string) {
        super(m);
        // there must be no code between super() and setPrototypeOf
        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        setPrototypeOf(this, NotFoundException.prototype);
        // this is a polyfill https://github.com/wesleytodd/setprototypeof. When target will be "es6" it can be replaced with "Object.setPrototypeOf"
    }
}