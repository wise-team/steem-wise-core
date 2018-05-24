import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "./ValidationError";

export class WeightRule extends Rule {
    private min: number;
    private max: number;
    private mode: WeightRule.Mode;

    public constructor(mode: WeightRule.Mode, min: number, max: number) {
        super();

        this.mode = mode;
        this.min = min;
        this.max = max;
    }

    public validate (
        op: SmartvotesOperation,
        callback: (error: Error, result: ValidationError | undefined) => void
    ): void {
        throw new Error("Not implemented yet");
    }

}

export namespace WeightRule {
    export enum Mode {
        SINGLE_VOTE_WEIGHT, VOTES_PER_DAY
    }
}