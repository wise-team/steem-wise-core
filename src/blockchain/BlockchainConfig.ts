export class BlockchainConfig {
    public static STEEM_100_PERCENT = 10000;
    public static STEEM_VOTE_REGENERATION_SECONDS = (5 * 60 * 60 * 24);
    public static STEEM_VOTE_DUST_THRESHOLD = 50000000;

    public static configValueAssertionArray: [string, any][] = [
        ["STEEM_100_PERCENT", BlockchainConfig.STEEM_100_PERCENT],
        ["STEEM_VOTE_REGENERATION_SECONDS", BlockchainConfig.STEEM_VOTE_REGENERATION_SECONDS],
        ["STEEM_VOTE_DUST_THRESHOLD", BlockchainConfig.STEEM_VOTE_DUST_THRESHOLD],
    ];
}