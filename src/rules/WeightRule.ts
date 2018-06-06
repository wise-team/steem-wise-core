import * as _ from "lodash";
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
        return Promise.resolve()
        .then(() => {
            if (!_.has(this, "mode")) throw new ValidationException("Weight rule: mode is missing");
            if (!_.has(this, "min")) throw new ValidationException("Weight rule: .min is missing");
            if (!_.has(this, "max")) throw new ValidationException("Weight rule: .max is missing");
        })
        .then(() => {
            if (this.mode === WeightRule.Mode.SINGLE_VOTE_WEIGHT) {
                if (voteorder.weight < this.min) throw new ValidationException("Weight is too low (" + voteorder.weight + " < " + this.min + ")");
                else if (voteorder.weight > this.max) throw new ValidationException("Weight is too high (" + voteorder.weight + " > " + this.max + ")");
            }
            else throw new Error("Unknown WeightRule.mode");
        });
    }

    public getRequiredProperties(): string [] {
        return ["mode", "min", "max"];
    }
}

export namespace WeightRule {
    export enum Mode {
        SINGLE_VOTE_WEIGHT = "single_vote_weight"
    }
}