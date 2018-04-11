export interface smartvotes_vote {
    slug: string;
    delegator: string;
    weight: smartvotes_vote_weight;
    type: smartvotes_vote_type;
}
export declare enum smartvotes_vote_type {
    vote = "vote",
    flag = "flag",
}
export declare type smartvotes_vote_weight = number;
