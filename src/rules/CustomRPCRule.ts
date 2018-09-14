/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as _ from "lodash";

import { Rule } from "./Rule";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { SendVoteorder } from "../protocol/SendVoteorder";

export class CustomRPCRule extends Rule {
    public rule: string = Rule.Type.CustomRPC;
    public host: string;
    public port: number;
    public path: string;
    public method: string;

    public constructor(host: string, port: number, path: string, method: string) {
        super();

        this.host = host;
        this.port = port;
        this.path = path;
        this.method = method;
    }

    public type(): Rule.Type {
        return Rule.Type.CustomRPC;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return BluebirdPromise.reject(new ValidationException("CustomRPC rule is not yet implemented")); // TODO
    }

    public validateRuleObject(unprototypedObj: any) {
        ["host", "port", "path", "method"].forEach(prop => {
            if (!_.has(unprototypedObj, prop)) throw new ValidationException("CustomRPCRule: property " + prop + " is missing");
        });
    }

    public getDescription(): string {
        return "CustomRPC to " + this.host + ":" + this.port + "/" + this.path + " " + this.method + "()";
    }
}