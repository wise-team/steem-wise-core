import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { Promise } from "bluebird";
import { SendVoteorder } from "../protocol/SendVoteorder";

export class CustomRPCRule extends Rule {
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
        return new Promise((resolve, reject) => {
            throw new ValidationException("CustomRPC rule is not yet implemented"); // TODO
        });
    }

}