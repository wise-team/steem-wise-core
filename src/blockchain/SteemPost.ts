export interface SteemPost {
    id: number;
    author: string;
    permlink: string;
    category: string;
    title: string;
    body: string;
    json_metadata: string;
    last_update: string;
    created: string;
    active: string;
    last_payout: string;
    [x: string]: any; // allows other properties
}
export namespace SteemPost {
    export interface JSONMetadata {
        tags: string [];
        [x: string]: any; // allows other properties
    }
}