/** This declaration file is a base for declaration files in other wise projects */

declare module 'steem' {
    export interface SteemJsOptions {
        /**
         * When url is used steem-js decides where to put it into the uri param or websocket param,
         * and sets the transport var by default
         */
        url?: string;
        uri?: string;
        websocket?: string;
        transport?: "ws" | "http";
        logger?: (...args: any []) => {}
    }

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

    /**
     * Type to describe result returned by the follow_api's get_blog_entries.
     */
    export interface BlogEntry {
        /**
         * Who authored the post (different if the post was reblogged).
         */
        author: string;

        /**
         * Permlink of the post.
         */
        permlink: string;

        /**
         * On whom blog the post is present. get_blog_entries(username) returns entries with blog=username.
         */
        blog: string;

        /**
         * ISO datetime string (eg. 1970-01-01T00:00:00)
         */
        reblog_on: string;

        /**
         * It is incremented for each new entry user creates. So the first entry has id=0, the second id=1, and so on.
         */
        entry_id: number;
    }

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

    export namespace GetBlock {
        export interface Block {
            block_id: string;
            previous: string;
            timestamp: string;
            transactions: Transaction [];
            [x: string]: any; // allows other properties
        }
        
        export interface Transaction {
            ref_block_num: number;
            transaction_id: string;
            operations: OperationWithDescriptor [];
            [x: string]: any; // allows other properties
        }
    }

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
        total_payout_value: string;
        curator_payout_value: string;
        active_votes: {
            voter: string;
            weight: number;
            rshares: number;
            percent: number;
            reputation: number;
            time: string
        } [];
        [x: string]: any; // allows other properties
    }

    export namespace SteemPost {
        export interface JSONMetadata {
            tags: string [];
            [x: string]: any; // allows other properties
        }
    } 

    export interface VoteOperation {
        voter: string;
        author: string;
        permlink: string;
        weight: number;
    }

    export type VoteOperationWithDescriptor = [ "vote", VoteOperation ];

    export interface CustomJsonOperation {
        id: string;
        json: string;
        required_auths: string [];
        required_posting_auths: string [];
    }

    export type CustomJsonOperationWithDescriptor = [ "custom_json", CustomJsonOperation ];

    export type UnknownOperationWithDescriptor = [ string, object ];

    export type OperationWithDescriptor = VoteOperationWithDescriptor | CustomJsonOperationWithDescriptor | UnknownOperationWithDescriptor;

    export namespace AccountHistory {
        export type Operation = [
            number,
            {
                block: number,
                op: OperationWithDescriptor,
                op_in_trx: number,
                timestamp: string,
                trx_id: string,
                trx_in_block: number,
                virtual_op: number
            }
        ];
    }

    export type SteemKeyRole 
            = "owner" | "active" | "posting" | "memo";

    export namespace api {
        export class Steem {
            public constructor(options: SteemJsOptions);
            /*addListener: any;
            broadcastBlock: any;
            broadcastBlockAsync: any;
            broadcastBlockWith: any;
            broadcastBlockWithAsync: any;
            broadcastTransaction: any;
            broadcastTransactionAsync: any;
            broadcastTransactionSynchronous: any;
            broadcastTransactionSynchronousAsync: any;
            broadcastTransactionSynchronousWith: any;
            broadcastTransactionSynchronousWithAsync: any;
            broadcastTransactionWith: any;
            broadcastTransactionWithAsync: any;
            broadcastTransactionWithCallback: any;
            broadcastTransactionWithCallbackAsync: any;
            broadcastTransactionWithCallbackWith: any;
            broadcastTransactionWithCallbackWithAsync: any;
            call: any;
            callAsync: any;
            cancelAllSubscriptions: any;
            cancelAllSubscriptionsAsync: any;
            cancelAllSubscriptionsWith: any;
            cancelAllSubscriptionsWithAsync: any;
            domain: any;
            emit: any;
            eventNames: any;
            getAccountBandwidth: any;
            getAccountBandwidthAsync: any;
            getAccountBandwidthWith: any;
            getAccountBandwidthWithAsync: any;
            getAccountCount: any;
            getAccountCountAsync: any;
            getAccountCountWith: any;
            getAccountCountWithAsync: any;*/

            // getAccountHistory: any;
            public getAccountHistoryAsync(account: string, from: number, batchLimit: number): Promise<AccountHistory.Operation []>;
            // getAccountHistoryWith: any;
            // getAccountHistoryWithAsync: any;

            /*getAccountReferences: any;
            getAccountReferencesAsync: any;
            getAccountReferencesWith: any;
            getAccountReferencesWithAsync: any;
            getAccountReputations: any;
            getAccountReputationsAsync: any;
            getAccountReputationsWith: any;
            getAccountReputationsWithAsync: any;
            getAccountVotes: any;
            getAccountVotesAsync: any;
            getAccountVotesWith: any;
            getAccountVotesWithAsync: any;*/

            // getAccounts: any;
            public getAccountsAsync (accounts: string []): Promise<AccountInfo []>;
            // getAccountsWith: any;

            /*getAccountsWithAsync: any;
            getActiveCategories: any;
            getActiveCategoriesAsync: any;
            getActiveCategoriesWith: any;
            getActiveCategoriesWithAsync: any;
            getActiveVotes: any;
            getActiveVotesAsync: any;
            getActiveVotesWith: any;
            getActiveVotesWithAsync: any;
            getActiveWitnesses: any;
            getActiveWitnessesAsync: any;
            getActiveWitnessesWith: any;
            getActiveWitnessesWithAsync: any;
            getApiByName: any;
            getApiByNameAsync: any;
            getApiByNameWith: any;
            getApiByNameWithAsync: any;
            getBestCategories: any;
            getBestCategoriesAsync: any;
            getBestCategoriesWith: any;
            getBestCategoriesWithAsync: any;

            // getBlock: any;*/
            public getBlockAsync(blockNum: number): Promise<GetBlock.Block>;
            // getBlockWith: any;
            // getBlockWithAsync: any;

            /*getBlockHeader: any;
            getBlockHeaderAsync: any;
            getBlockHeaderWith: any;
            getBlockHeaderWithAsync: any;
            getBlog: any;
            getBlogAsync: any;
            getBlogAuthors: any;
            getBlogAuthorsAsync: any;
            getBlogAuthorsWith: any;
            getBlogAuthorsWithAsync: any;

            // getBlogEntries: any;*/
            public getBlogEntriesAsync(account: string, startFrom: number, limit: number): Promise<BlogEntry []>;
            // getBlogEntriesWith: any;
            // getBlogEntriesWithAsync: any;

            /*getBlogWith: any;
            getBlogWithAsync: any;
            getChainProperties: any;
            getChainPropertiesAsync: any;
            getChainPropertiesWith: any;
            getChainPropertiesWithAsync: any;
            getCommentDiscussionsByPayout: any;
            getCommentDiscussionsByPayoutAsync: any;
            getCommentDiscussionsByPayoutWith: any;
            getCommentDiscussionsByPayoutWithAsync: any;*/

            // getConfig: any;
            getConfigAsync(): Promise<{ [s: string]: string; }>;
            // getConfigWith: any;
            // getConfigWithAsync: any;

            // getContent: any;
            getContentAsync(author: string, permlink: string): SteemPost;
            // getContentWith: any;
            // getContentWithAsync: any;

            /*getContentReplies: any;
            getContentRepliesAsync: any;
            getContentRepliesWith: any;
            getContentRepliesWithAsync: any;*/
            /*getConversionRequests: any;
            getConversionRequestsAsync: any;
            getConversionRequestsWith: any;
            getConversionRequestsWithAsync: any;
            getCurrentMedianHistoryPrice: any;
            getCurrentMedianHistoryPriceAsync: any;
            getCurrentMedianHistoryPriceWith: any;
            getCurrentMedianHistoryPriceWithAsync: any;
            getDiscussionsByActive: any;
            getDiscussionsByActiveAsync: any;
            getDiscussionsByActiveWith: any;
            getDiscussionsByActiveWithAsync: any;
            getDiscussionsByAuthorBeforeDate: any;
            getDiscussionsByAuthorBeforeDateAsync: any;
            getDiscussionsByAuthorBeforeDateWith: any;
            getDiscussionsByAuthorBeforeDateWithAsync: any;
            getDiscussionsByBlog: any;
            getDiscussionsByBlogAsync: any;
            getDiscussionsByBlogWith: any;
            getDiscussionsByBlogWithAsync: any;
            getDiscussionsByCashout: any;
            getDiscussionsByCashoutAsync: any;
            getDiscussionsByCashoutWith: any;
            getDiscussionsByCashoutWithAsync: any;
            getDiscussionsByChildren: any;
            getDiscussionsByChildrenAsync: any;
            getDiscussionsByChildrenWith: any;
            getDiscussionsByChildrenWithAsync: any;
            getDiscussionsByComments: any;
            getDiscussionsByCommentsAsync: any;
            getDiscussionsByCommentsWith: any;
            getDiscussionsByCommentsWithAsync: any;
            getDiscussionsByCreated: any;
            getDiscussionsByCreatedAsync: any;
            getDiscussionsByCreatedWith: any;
            getDiscussionsByCreatedWithAsync: any;
            getDiscussionsByFeed: any;
            getDiscussionsByFeedAsync: any;
            getDiscussionsByFeedWith: any;
            getDiscussionsByFeedWithAsync: any;
            getDiscussionsByHot: any;
            getDiscussionsByHotAsync: any;
            getDiscussionsByHotWith: any;
            getDiscussionsByHotWithAsync: any;
            getDiscussionsByPayout: any;
            getDiscussionsByPayoutAsync: any;
            getDiscussionsByPayoutWith: any;
            getDiscussionsByPayoutWithAsync: any;
            getDiscussionsByPromoted: any;
            getDiscussionsByPromotedAsync: any;
            getDiscussionsByPromotedWith: any;
            getDiscussionsByPromotedWithAsync: any;
            getDiscussionsByTrending: any;
            getDiscussionsByTrending30: any;
            getDiscussionsByTrending30Async: any;
            getDiscussionsByTrending30With: any;
            getDiscussionsByTrending30WithAsync: any;
            getDiscussionsByTrendingAsync: any;
            getDiscussionsByTrendingWith: any;
            getDiscussionsByTrendingWithAsync: any;
            getDiscussionsByVotes: any;
            getDiscussionsByVotesAsync: any;
            getDiscussionsByVotesWith: any;
            getDiscussionsByVotesWithAsync: any;*/

            // getDynamicGlobalProperties: any;
            getDynamicGlobalPropertiesAsync(): Promise<DynamicGlobalProperties>;
            // getDynamicGlobalPropertiesWith: any;
            // getDynamicGlobalPropertiesWithAsync: any;

            /*getEscrow: any;
            getEscrowAsync: any;
            getEscrowWith: any;
            getEscrowWithAsync: any;
            getFeed: any;
            getFeedAsync: any;
            getFeedEntries: any;
            getFeedEntriesAsync: any;
            getFeedEntriesWith: any;
            getFeedEntriesWithAsync: any;
            getFeedHistory: any;
            getFeedHistoryAsync: any;
            getFeedHistoryWith: any;
            getFeedHistoryWithAsync: any;
            getFeedWith: any;
            getFeedWithAsync: any;
            getFollowCount: any;
            getFollowCountAsync: any;
            getFollowCountWith: any;
            getFollowCountWithAsync: any;
            getFollowers: any;
            getFollowersAsync: any;
            getFollowersWith: any;
            getFollowersWithAsync: any;
            getFollowing: any;
            getFollowingAsync: any;
            getFollowingWith: any;
            getFollowingWithAsync: any;
            getHardforkVersion: any;
            getHardforkVersionAsync: any;
            getHardforkVersionWith: any;
            getHardforkVersionWithAsync: any;
            getKeyReferences: any;
            getKeyReferencesAsync: any;
            getKeyReferencesWith: any;
            getKeyReferencesWithAsync: any;
            getLiquidityQueue: any;
            getLiquidityQueueAsync: any;
            getLiquidityQueueWith: any;
            getLiquidityQueueWithAsync: any;
            getMarketHistory: any;
            getMarketHistoryAsync: any;
            getMarketHistoryBuckets: any;
            getMarketHistoryBucketsAsync: any;
            getMarketHistoryBucketsWith: any;
            getMarketHistoryBucketsWithAsync: any;
            getMarketHistoryWith: any;
            getMarketHistoryWithAsync: any;
            getMarketOrderBook: any;
            getMarketOrderBookAsync: any;
            getMarketOrderBookWith: any;
            getMarketOrderBookWithAsync: any;
            getMaxListeners: any;
            getMinerQueue: any;
            getMinerQueueAsync: any;
            getMinerQueueWith: any;
            getMinerQueueWithAsync: any;
            getNextScheduledHardfork: any;
            getNextScheduledHardforkAsync: any;
            getNextScheduledHardforkWith: any;
            getNextScheduledHardforkWithAsync: any;
            getOpenOrders: any;
            getOpenOrdersAsync: any;
            getOpenOrdersWith: any;
            getOpenOrdersWithAsync: any;
            getOpsInBlock: any;
            getOpsInBlockAsync: any;
            getOpsInBlockWith: any;
            getOpsInBlockWithAsync: any;
            getOrderBook: any;
            getOrderBookAsync: any;
            getOrderBookWith: any;
            getOrderBookWithAsync: any;
            getOwnerHistory: any;
            getOwnerHistoryAsync: any;
            getOwnerHistoryWith: any;
            getOwnerHistoryWithAsync: any;
            getPostDiscussionsByPayout: any;
            getPostDiscussionsByPayoutAsync: any;
            getPostDiscussionsByPayoutWith: any;
            getPostDiscussionsByPayoutWithAsync: any;
            getPotentialSignatures: any;
            getPotentialSignaturesAsync: any;
            getPotentialSignaturesWith: any;
            getPotentialSignaturesWithAsync: any;
            getRebloggedBy: any;
            getRebloggedByAsync: any;
            getRebloggedByWith: any;
            getRebloggedByWithAsync: any;
            getRecentCategories: any;
            getRecentCategoriesAsync: any;
            getRecentCategoriesWith: any;
            getRecentCategoriesWithAsync: any;
            getRecentTrades: any;
            getRecentTradesAsync: any;
            getRecentTradesWith: any;
            getRecentTradesWithAsync: any;
            getRecoveryRequest: any;
            getRecoveryRequestAsync: any;
            getRecoveryRequestWith: any;
            getRecoveryRequestWithAsync: any;
            getRepliesByLastUpdate: any;
            getRepliesByLastUpdateAsync: any;
            getRepliesByLastUpdateWith: any;
            getRepliesByLastUpdateWithAsync: any;
            getRequiredSignatures: any;
            getRequiredSignaturesAsync: any;
            getRequiredSignaturesWith: any;
            getRequiredSignaturesWithAsync: any;
            getRewardFund: any;
            getRewardFundAsync: any;
            getRewardFundWith: any;
            getRewardFundWithAsync: any;
            getSavingsWithdrawFrom: any;
            getSavingsWithdrawFromAsync: any;
            getSavingsWithdrawFromWith: any;
            getSavingsWithdrawFromWithAsync: any;
            getSavingsWithdrawTo: any;
            getSavingsWithdrawToAsync: any;
            getSavingsWithdrawToWith: any;
            getSavingsWithdrawToWithAsync: any;
            getState: any;
            getStateAsync: any;
            getStateWith: any;
            getStateWithAsync: any;
            getTagsUsedByAuthor: any;
            getTagsUsedByAuthorAsync: any;
            getTagsUsedByAuthorWith: any;
            getTagsUsedByAuthorWithAsync: any;
            getTicker: any;
            getTickerAsync: any;
            getTickerWith: any;
            getTickerWithAsync: any;
            getTradeHistory: any;
            getTradeHistoryAsync: any;
            getTradeHistoryWith: any;
            getTradeHistoryWithAsync: any;
            getTransaction: any;
            getTransactionAsync: any;
            getTransactionHex: any;
            getTransactionHexAsync: any;
            getTransactionHexWith: any;
            getTransactionHexWithAsync: any;
            getTransactionWith: any;
            getTransactionWithAsync: any;
            getTrendingCategories: any;
            getTrendingCategoriesAsync: any;
            getTrendingCategoriesWith: any;
            getTrendingCategoriesWithAsync: any;
            getTrendingTags: any;
            getTrendingTagsAsync: any;
            getTrendingTagsWith: any;
            getTrendingTagsWithAsync: any;
            getVersion: any;
            getVersionAsync: any;
            getVersionWith: any;
            getVersionWithAsync: any;
            getVestingDelegations: any;
            getVestingDelegationsAsync: any;
            getVestingDelegationsWith: any;
            getVestingDelegationsWithAsync: any;
            getVolume: any;
            getVolumeAsync: any;
            getVolumeWith: any;
            getVolumeWithAsync: any;
            getWithdrawRoutes: any;
            getWithdrawRoutesAsync: any;
            getWithdrawRoutesWith: any;
            getWithdrawRoutesWithAsync: any;
            getWitnessByAccount: any;
            getWitnessByAccountAsync: any;
            getWitnessByAccountWith: any;
            getWitnessByAccountWithAsync: any;
            getWitnessCount: any;
            getWitnessCountAsync: any;
            getWitnessCountWith: any;
            getWitnessCountWithAsync: any;
            getWitnessSchedule: any;
            getWitnessScheduleAsync: any;
            getWitnessScheduleWith: any;
            getWitnessScheduleWithAsync: any;
            getWitnesses: any;
            getWitnessesAsync: any;
            getWitnessesByVote: any;
            getWitnessesByVoteAsync: any;
            getWitnessesByVoteWith: any;
            getWitnessesByVoteWithAsync: any;
            getWitnessesWith: any;
            getWitnessesWithAsync: any;
            listenerCount: any;
            listeners: any;
            log: any;
            login: any;
            loginAsync: any;
            loginWith: any;
            loginWithAsync: any;
            lookupAccountNames: any;
            lookupAccountNamesAsync: any;
            lookupAccountNamesWith: any;
            lookupAccountNamesWithAsync: any;
            lookupAccounts: any;
            lookupAccountsAsync: any;
            lookupAccountsWith: any;
            lookupAccountsWithAsync: any;
            lookupWitnessAccounts: any;
            lookupWitnessAccountsAsync: any;
            lookupWitnessAccountsWith: any;
            lookupWitnessAccountsWithAsync: any;
            on: any;
            once: any;
            options: {
                Config: any;
                address_prefix: string;
                chain_id: string;
                dev_uri: string;
                get: any;
                set: any;
                stage_uri: string;
                transport: string;
                uri: string;
                url: string;
                websocket: string;
            };
            prependListener: any;
            prependOnceListener: any;
            removeAllListeners: any;
            removeListener: any;
            send: any;
            seqNo: number;
            setBlockAppliedCallback: any;
            setBlockAppliedCallbackAsync: any;
            setBlockAppliedCallbackWith: any;
            setBlockAppliedCallbackWithAsync: any;
            setMaxBlockAge: any;
            setMaxBlockAgeAsync: any;
            setMaxBlockAgeWith: any;
            setMaxBlockAgeWithAsync: any;
            setMaxListeners: any;
            setOptions: any;
            setPendingTransactionCallback: any;
            setPendingTransactionCallbackAsync: any;
            setPendingTransactionCallbackWith: any;
            setPendingTransactionCallbackWithAsync: any;
            setSubscribeCallback: any;
            setSubscribeCallbackAsync: any;
            setSubscribeCallbackWith: any;
            setSubscribeCallbackWithAsync: any;
            setUri: any;
            setWebSocket: any;
            signedCall: any;
            signedCallAsync: any;
            start: any;
            stop: any;
            streamBlock: any;
            streamBlockNumber: any;
            streamOperations: any;
            streamTransactions: any;
            transport: {
                addListener: any;
                addListenerAsync: any;
                domain: any;
                emit: any;
                emitAsync: any;
                eventNames: any;
                eventNamesAsync: any;
                getMaxListeners: any;
                getMaxListenersAsync: any;
                id: number;
                listenTo: any;
                listenToAsync: any;
                listenerCount: any;
                listenerCountAsync: any;
                listeners: any;
                listenersAsync: any;
                on: any;
                onAsync: any;
                once: any;
                onceAsync: any;
                options: {
                    Config: any;
                    address_prefix: string;
                    chain_id: string;
                    dev_uri: string;
                    get: any;
                    set: any;
                    stage_uri: string;
                    transport: string;
                    uri: string;
                    url: string;
                    websocket: string;
                };
                prependListener: any;
                prependListenerAsync: any;
                prependOnceListener: any;
                prependOnceListenerAsync: any;
                removeAllListeners: any;
                removeAllListenersAsync: any;
                removeListener: any;
                removeListenerAsync: any;
                send: any;
                sendAsync: any;
                setMaxListeners: any;
                setMaxListenersAsync: any;
                setOptions: any;
                setOptionsAsync: any;
                start: any;
                startAsync: any;
                stop: any;
                stopAsync: any;
            };
            verifyAccountAuthority: any;
            verifyAccountAuthorityAsync: any;
            verifyAccountAuthorityWith: any;
            verifyAccountAuthorityWithAsync: any;
            verifyAuthority: any;
            verifyAuthorityAsync: any;
            verifyAuthorityWith: any;
            verifyAuthorityWithAsync: any;*/
        }
    }

    export namespace auth {
        export function generateKeys(name: string, password: string, roles: SteemKeyRole []):
            { [role: string]: string };
        
        /**
         * 
         * @param name - blockchain account name
         * @param password - very strong password typically no shorter than a private key
         * @param roles - defaults to standard Steem blockchain-level roles
         */
        export function getPrivateKeys(name: string, password: string, roles: SteemKeyRole []):
            { [roleKey: string]: string };
        
        export function isPubkey(pubKey: string, address_prefix: string): boolean;
        
        export function isWif(privWif: string): boolean;
        
        export function signTransaction(trx: any): { signatures: Buffer []; [x: string]: any; };
        
        export function toWif(name: string, password: string, role: SteemKeyRole): string;
        
        export function verify(name: string, password: string, auths: SteemKeyRole []): boolean;
        
        export function wifIsValid(privWif: string, pubWif: string): boolean;
        
        export function wifToPublic(privWif: string): string;
    }

    export const broadcast: {
            accountCreate: any;
            accountCreateAsync: any;
            accountCreateWith: any;
            accountCreateWithAsync: any;
            accountCreateWithDelegation: any;
            accountCreateWithDelegationAsync: any;
            accountCreateWithDelegationWith: any;
            accountCreateWithDelegationWithAsync: any;
            accountUpdate: any;
            accountUpdateAsync: any;
            accountUpdateWith: any;
            accountUpdateWithAsync: any;
            accountWitnessProxy: any;
            accountWitnessProxyAsync: any;
            accountWitnessProxyWith: any;
            accountWitnessProxyWithAsync: any;
            accountWitnessVote: any;
            accountWitnessVoteAsync: any;
            accountWitnessVoteWith: any;
            accountWitnessVoteWithAsync: any;
            addAccountAuth: any;
            addAccountAuthAsync: any;
            addKeyAuth: any;
            addKeyAuthAsync: any;
            cancelTransferFromSavings: any;
            cancelTransferFromSavingsAsync: any;
            cancelTransferFromSavingsWith: any;
            cancelTransferFromSavingsWithAsync: any;
            challengeAuthority: any;
            challengeAuthorityAsync: any;
            challengeAuthorityWith: any;
            challengeAuthorityWithAsync: any;
            changeRecoveryAccount: any;
            changeRecoveryAccountAsync: any;
            changeRecoveryAccountWith: any;
            changeRecoveryAccountWithAsync: any;
            claimRewardBalance: any;
            claimRewardBalanceAsync: any;
            claimRewardBalanceWith: any;
            claimRewardBalanceWithAsync: any;
            comment: any;
            commentAsync: any;
            commentOptions: any;
            commentOptionsAsync: any;
            commentOptionsWith: any;
            commentOptionsWithAsync: any;
            commentReward: any;
            commentRewardAsync: any;
            commentRewardWith: any;
            commentRewardWithAsync: any;
            commentWith: any;
            commentWithAsync: any;
            convert: any;
            convertAsync: any;
            convertWith: any;
            convertWithAsync: any;
            custom: any;
            customAsync: any;
            customBinary: any;
            customBinaryAsync: any;
            customBinaryWith: any;
            customBinaryWithAsync: any;
            customJson: any;
            customJsonAsync: any;
            customJsonWith: any;
            customJsonWithAsync: any;
            customWith: any;
            customWithAsync: any;
            declineVotingRights: any;
            declineVotingRightsAsync: any;
            declineVotingRightsWith: any;
            declineVotingRightsWithAsync: any;
            delegateVestingShares: any;
            delegateVestingSharesAsync: any;
            delegateVestingSharesWith: any;
            delegateVestingSharesWithAsync: any;
            deleteComment: any;
            deleteCommentAsync: any;
            deleteCommentWith: any;
            deleteCommentWithAsync: any;
            escrowApprove: any;
            escrowApproveAsync: any;
            escrowApproveWith: any;
            escrowApproveWithAsync: any;
            escrowDispute: any;
            escrowDisputeAsync: any;
            escrowDisputeWith: any;
            escrowDisputeWithAsync: any;
            escrowRelease: any;
            escrowReleaseAsync: any;
            escrowReleaseWith: any;
            escrowReleaseWithAsync: any;
            escrowTransfer: any;
            escrowTransferAsync: any;
            escrowTransferWith: any;
            escrowTransferWithAsync: any;
            feedPublish: any;
            feedPublishAsync: any;
            feedPublishWith: any;
            feedPublishWithAsync: any;
            fillConvertRequest: any;
            fillConvertRequestAsync: any;
            fillConvertRequestWith: any;
            fillConvertRequestWithAsync: any;
            fillOrder: any;
            fillOrderAsync: any;
            fillOrderWith: any;
            fillOrderWithAsync: any;
            fillTransferFromSavings: any;
            fillTransferFromSavingsAsync: any;
            fillTransferFromSavingsWith: any;
            fillTransferFromSavingsWithAsync: any;
            fillVestingWithdraw: any;
            fillVestingWithdrawAsync: any;
            fillVestingWithdrawWith: any;
            fillVestingWithdrawWithAsync: any;
            interest: any;
            interestAsync: any;
            interestWith: any;
            interestWithAsync: any;
            limitOrderCancel: any;
            limitOrderCancelAsync: any;
            limitOrderCancelWith: any;
            limitOrderCancelWithAsync: any;
            limitOrderCreate: any;
            limitOrderCreate2: any;
            limitOrderCreate2Async: any;
            limitOrderCreate2With: any;
            limitOrderCreate2WithAsync: any;
            limitOrderCreateAsync: any;
            limitOrderCreateWith: any;
            limitOrderCreateWithAsync: any;
            liquidityReward: any;
            liquidityRewardAsync: any;
            liquidityRewardWith: any;
            liquidityRewardWithAsync: any;
            pow: any;
            pow2: any;
            pow2Async: any;
            pow2With: any;
            pow2WithAsync: any;
            powAsync: any;
            powWith: any;
            powWithAsync: any;
            price: any;
            priceAsync: any;
            priceWith: any;
            priceWithAsync: any;
            proveAuthority: any;
            proveAuthorityAsync: any;
            proveAuthorityWith: any;
            proveAuthorityWithAsync: any;
            recoverAccount: any;
            recoverAccountAsync: any;
            recoverAccountWith: any;
            recoverAccountWithAsync: any;
            removeAccountAuth: any;
            removeAccountAuthAsync: any;
            removeKeyAuth: any;
            removeKeyAuthAsync: any;
            requestAccountRecovery: any;
            requestAccountRecoveryAsync: any;
            requestAccountRecoveryWith: any;
            requestAccountRecoveryWithAsync: any;
            resetAccount: any;
            resetAccountAsync: any;
            resetAccountWith: any;
            resetAccountWithAsync: any;
            send: any;
            sendAsync: any;
            setResetAccount: any;
            setResetAccountAsync: any;
            setResetAccountWith: any;
            setResetAccountWithAsync: any;
            setWithdrawVestingRoute: any;
            setWithdrawVestingRouteAsync: any;
            setWithdrawVestingRouteWith: any;
            setWithdrawVestingRouteWithAsync: any;
            transfer: any;
            transferAsync: any;
            transferFromSavings: any;
            transferFromSavingsAsync: any;
            transferFromSavingsWith: any;
            transferFromSavingsWithAsync: any;
            transferToSavings: any;
            transferToSavingsAsync: any;
            transferToSavingsWith: any;
            transferToSavingsWithAsync: any;
            transferToVesting: any;
            transferToVestingAsync: any;
            transferToVestingWith: any;
            transferToVestingWithAsync: any;
            transferWith: any;
            transferWithAsync: any;
            vote: any;
            voteAsync: any;
            voteWith: any;
            voteWithAsync: any;
            withdrawVesting: any;
            withdrawVestingAsync: any;
            withdrawVestingWith: any;
            withdrawVestingWithAsync: any;
            witnessUpdate: any;
            witnessUpdateAsync: any;
            witnessUpdateWith: any;
            witnessUpdateWithAsync: any;
        };
    export const config: {
            Config: any;
            address_prefix: string;
            chain_id: string;
            dev_uri: string;
            get: any;
            set: any;
            stage_uri: string;
            transport: string;
            uri: string;
            url: string;
            websocket: string;
        };
    export const formatter: {
            amount: any;
            commentPermlink: any;
            createSuggestedPassword: any;
            estimateAccountValue: any;
            numberWithCommas: any;
            reputation: any;
            vestToSteem: any;
            vestingSteem: any;
        };
    export const memo: {
            decode: any;
            encode: any;
        };
    export const utils: {
            camelCase: any;
            validateAccountName: any;
    };
}