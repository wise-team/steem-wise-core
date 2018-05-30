export interface AccountInfo {
    average_bandwidth: string; // number returned as string
    average_market_bandwidth: number;
    balance: string;
    can_vote: boolean;
    comment_count: number;
    created: string; // UTC DATE WITHOUT Z
    curation_rewards: number;
    delegated_vesting_share: string; // "0.000000 VESTS"
    guest_bloggers: any [];
    id: number;
    json_metadata: string;
    last_account_recovery: string; // UTC DATE WITHOUT Z
    last_account_update: string; // UTC DATE WITHOUT Z
    last_bandwidth_update: string; // UTC DATE WITHOUT Z
    last_market_bandwidth_update: string; // UTC DATE WITHOUT Z
    last_owner_update: string; // UTC DATE WITHOUT Z
    last_post: string; // UTC DATE WITHOUT Z
    last_root_post: string; // UTC DATE WITHOUT Z
    last_vote_time: string; // UTC DATE WITHOUT Z
    lifetime_bandwidth: string; // number returned as string
    lifetime_market_bandwidth: number;
    lifetime_vote_count: number;
    market_history: any [];
    memo_key: string;
    mined: boolean;
    name: string;
    next_vesting_withdrawal: string; // number returned as string
    owner: any;
    post_count: number;
    posting: any;
    posting_rewards: number;
    received_vesting_shares: string; // "0.000000 VESTS"
    recovery_account: string;
    reputation: number;
    reset_account: string;
    reward_sbd_balance: string; // "0.000 SBD"
    reward_steem_balance: string; // "0.000 STEEM"
    reward_vesting_balance: string; // "0.000000 VESTS"
    reward_vesting_steem: string; // "0.000 STEEM"
    savings_balance: string; // "0.000 STEEM"
    savings_sbd_balance: string; // "0.000 SBD"
    savings_sbd_last_interest_payment: string; // number returned as string
    savings_sbd_seconds: string; // number returned as string
    savings_sbd_seconds_last_update: string; // number returned as string
    savings_withdraw_requests: number;
    sbd_balance: string; // "0.000 SBD"
    sbd_last_interest_payment: string; // number returned as string
    sbd_seconds: string; // number returned as string
    sbd_seconds_last_update: string; // number returned as string
    tags_usage: any [];
    to_withdraw: number;
    transfer_history: any [];
    vesting_balance: string; // "0.000 STEEM"
    vesting_shares: string; // "0.000000 VESTS"
    vesting_withdraw_rate: string; // "0.000000 VESTS"
    vote_history: any [];
    voting_power: number;
    withdraw_routes: number;
    withdrawn: number;
    witness_votes: number;
    witnesses_voted_for: number;
    [x: string]: any; // allows other properties
}