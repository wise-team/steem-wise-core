import setPrototypeOf = require("setprototypeof");

export class ValidationError extends Error {
    constructor(m: string) {
        super(m);
        // there must be no code between super() and setPrototypeOf
        // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        setPrototypeOf(this, ValidationError.prototype);
        // this is a polyfill https://github.com/wesleytodd/setprototypeof. When target will be "es6" it can be replaced with "Object.setPrototypeOf"
    }

    public validationError: boolean = true;
}