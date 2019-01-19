export class BlockchainConfig {
    public static STEEM_100_PERCENT = 10000;
    public static STEEM_VOTING_MANA_REGENERATION_SECONDS = 5 * 60 * 60 * 24;
    public static STEEM_VOTE_DUST_THRESHOLD = 50000000;

    public static configValueAssertionArray: [string, any][] = [
        ["STEEM_100_PERCENT", BlockchainConfig.STEEM_100_PERCENT],
        ["STEEM_VOTING_MANA_REGENERATION_SECONDS", BlockchainConfig.STEEM_VOTING_MANA_REGENERATION_SECONDS],
        ["STEEM_VOTE_DUST_THRESHOLD", BlockchainConfig.STEEM_VOTE_DUST_THRESHOLD],
    ];

    public static ACCOUNT_HISTORY_MAX_BATCH_SIZE = 10000; // (10k) https://github.com/steemit/steem/commit/292f3414bdcb0557db87181248dca65d7512e820
}
