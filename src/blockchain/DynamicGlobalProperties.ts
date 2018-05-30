export interface DynamicGlobalProperties {
    average_block_size: number;
    confidential_sbd_supply: string; // "0.000 SBD"
    confidential_supply: string; // "0.000 STEEM"
    current_aslot: number;
    current_reserve_ratio: number;
    current_sbd_supply: string; // "14481600.548 SBD"
    current_supply: string; // "269083057.689 STEEM"
    current_witness: string;
    head_block_id: string;
    head_block_number: number;
    last_irreversible_block_num: number;
    max_virtual_bandwidth: string; // number as string
    maximum_block_size: number;
    num_pow_witnesses: number;
    participation_count: number;
    pending_rewarded_vesting_shares: string; // "382592273.262052 VESTS"
    pending_rewarded_vesting_steem: string; // "186609.614 STEEM"
    recent_slots_filled: string;
    sbd_interest_rate: number;
    sbd_print_rate: number;
    time: string; // UTS date without Z
    total_pow: number;
    total_reward_fund_steem: string; // "0.000 STEEM"
    total_reward_shares2: string; // number as string
    total_vesting_fund_steem: string; // "191509857.965 STEEM"
    total_vesting_shares: string; // "389413833439.511926 VESTS"
    virtual_supply: string; // "275144841.091 STEEM"
    vote_power_reserve_rate: number;
    [x: string]: any; // allows other properties
}