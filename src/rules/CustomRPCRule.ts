import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "../validation/ValidationError";
import { ValidationContext } from "../validation/ValidationContext";

export class CustomRPCRule extends Rule {
    private host: string;
    private port: number;
    private path: string;
    private method: string;

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

    public validate (
        op: SmartvotesOperation,
        context: ValidationContext,
        callback: (error: Error | undefined, result: ValidationError | true) => void
    ): void {
        throw new Error("Not implemented yet");
    }

}