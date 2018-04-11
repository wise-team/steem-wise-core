/* tslint:disable:class-name */

export interface smartvotes_vote {
    slug: string;
    delegator: string;
    weight: smartvotes_vote_weight;
    type: smartvotes_vote_type;
}

export enum smartvotes_vote_type {
    vote = "vote",
    flag = "flag"
}

export type smartvotes_vote_weight = number;