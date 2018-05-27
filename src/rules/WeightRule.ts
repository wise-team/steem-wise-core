import { Rule } from "./Rule";
import { SmartvotesOperation } from "../protocol/SmartvotesOperation";
import { ValidationError } from "../validation/ValidationError";
import { ValidationContext } from "../validation/ValidationContext";
import { Promise } from "bluebird";
import { SendVoteorder } from "../protocol/SendVoteorder";

export class WeightRule extends Rule {
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

    public validate (voteorder: SendVoteorder, context: ValidationContext): Promise<true> {
        return new Promise((resolve, reject) => {
            if (this.mode === WeightRule.Mode.SINGLE_VOTE_WEIGHT) {
                return voteorder.weight >= this.min && voteorder.weight <= this.max;
            }
            else if (this.mode === WeightRule.Mode.VOTES_PER_DAY) {
                throw new Error("Not implemented yet"); // TODO
            }
            else throw new Error("Unknown WeightRule.mode");
        });
    }

}

export namespace WeightRule {
    export enum Mode {
        SINGLE_VOTE_WEIGHT, VOTES_PER_DAY
    }
}