import { Api } from "../api/Api";
import { ValidationError } from "./ValidationError";
import { Protocol } from "../protocol/Protocol";
import { SendVoteorder } from "../protocol/SendVoteorder";
import { ProggressCallback } from "../ProggressCallback";

export class Validator {
    private api: Api;
    private protocol: Protocol;

    public constructor(api: Api, protocol: Protocol) {
        this.api = api;
        this.protocol = protocol;
    }

    public validate(delegator: string, voter: string, voteorder: SendVoteorder,
        callback: (error: Error | undefined, result: ValidationError | true) => void,
        proggressCallback: ProggressCallback) {
        throw new Error("Not implemented yet");
    }
}