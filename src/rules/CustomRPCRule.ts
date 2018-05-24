import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "./ValidationError";

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

    public validate (
        op: SmartvotesOperation,
        callback: (error: Error, result: ValidationError | undefined) => void
    ): void {
        throw new Error("Not implemented yet");
    }

}