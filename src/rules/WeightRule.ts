import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationException } from "../validation/ValidationException";
import { ValidationContext } from "../validation/ValidationContext";
import { Promise } from "bluebird";
import { SendVoteorder } from "../protocol/SendVoteorder";

export class WeightRule extends Rule {
    public rule: string = Rule.Type.Weight;
    public min: number;
    public max: number;
    public mode: WeightRule.Mode;

    public constructor(mode: WeightRule.Mode, min: number, max: number) {
        super();

        this.mode = mode;
        this.min = min;
        this.max = max;
    }

    public type(): Rule.Type {
        return Rule.Type.Weight;
    }

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.mode === WeightRule.Mode.SINGLE_VOTE_WEIGHT) {
                if (voteorder.weight < this.min) throw new ValidationException("Weight is too low (" + voteorder.weight + " < " + this.min + ")");
                else if (voteorder.weight > this.max) throw new ValidationException("Weight is too high (" + voteorder.weight + " > " + this.max + ")");
                else resolve();
            }
            else throw new Error("Unknown WeightRule.mode");
        });
    }

}

export namespace WeightRule {
    export enum Mode {
        SINGLE_VOTE_WEIGHT = "single_vote_weight"
    }
}