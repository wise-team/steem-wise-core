import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "../validation/ValidationError";
import { ValidationContext } from "../validation/ValidationContext";

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

    public type(): Rule.Type {
        return Rule.Type.Weight;
    }

    public validate (
        op: SmartvotesOperation,
        context: ValidationContext,
        callback: (error: Error | undefined, result: ValidationError | true) => void
    ): void {
        throw new Error("Not implemented yet");
    }

}

export namespace WeightRule {
    export enum Mode {
        SINGLE_VOTE_WEIGHT, VOTES_PER_DAY
    }
}