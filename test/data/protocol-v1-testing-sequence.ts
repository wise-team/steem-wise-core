import { smartvotes_ruleset, smartvotes_voteorder } from "../../src/protocol/versions/v1/smartvotes.schema";
import { SteemOperationNumber } from "../../src/blockchain/SteemOperationNumber";

/**
 * These are rulesets used for synchronization unit tests. They are uploaded to @steemprojects2
 * steem account and delegate votes to @steemprojects1. The beauty of the blockchain tehnology allowed us to upload them in such a way, that
 *  they will always exist as long, as Steem exists.
 */

export interface VoteConfirmedAtMoment {
  opNum: SteemOperationNumber;
  voteorderTransactionId: string;
  voteorderOperationNum: number;
}

export interface RulesetsAtMoment {
  opNum: SteemOperationNumber;
  rulesets: smartvotes_ruleset [];
  validityUntil: SteemOperationNumber;
}

export interface VoteorderAtMoment {
  transactionId: string;
  opNum: SteemOperationNumber;
  voter: string;
  voteorder: smartvotes_voteorder;
}

export const delegator: string = "steemprojects2";

export const previousArtifactoryInvalidVoteorders: VoteorderAtMoment [] = [
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(22144602, 17, 0),
            transactionId: "453a45b6524300039613a1f102a303bfd9c6b07a"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(22144653, 58, 0),
            transactionId: "aea0c24c9a4d5ad6a3c6add3bea3d7ddcce37769"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22144659,
              34,
              0
            ),
            transactionId: "85bcf93dc99d5c6c61e68b34be7f87ef0f3022b7"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22144664,
              60,
              0
            ),
            transactionId: "72642038ea7f80346a2d1533af7a9cad336891f8"
          }, // "Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22172968,
              41,
              0
            ),
            transactionId: "d7bd6ae1ad4afee632bfdda8056ff56e288c75ff"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22202350,
              29,
              0
            ),
            transactionId: "f887d5904fe2ec8dd16fd1bb49c13c4f34e92c9f"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22202938,
              14,
              0
            ),
            transactionId: "70234e576dd2284b069b782cc482b26f3e22439b"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22224604,
              7,
              0
            ),
            transactionId: "7f9e8d6745fd3a9f6a74bd301c640e999081bc9f"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22224668,
              20,
              0
            ),
            transactionId: "9d75c9089129b06e072d726bff38b3484381a5d4"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22225183,
              26,
              0
            ),
            transactionId: "9273746ff6d037c26028618aef531de49f0c0354"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22231804,
              10,
              0
            ),
            transactionId: "47744e027a0dd42aec066e54bbf32c1e57c28f9f"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22258112,
              21,
              0
            ),
            transactionId: "4f51b152cd69f0545630e2237bc84a9b9550df62"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22258438,
              4,
              0
            ),
            transactionId: "2d6a488be52f7aeaf6284740bbde1c8aedfc29c4"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22258854,
              44,
              0
            ),
            transactionId: "6c2812b3662a3729c104e668c87e022eb2268dd0"
          }, // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime.
          {
            voter: "guest123",
            voteorder: {
              ruleset_name: "Upvote, allow author @noisy",
              author: "noisy",
              permlink: "bitcoin-translation-decentralized-truth-polish-subtitles-for-andreas-m-antonopoulos-video",
              delegator: "steemprojects1",
              weight: 1,
              type: "upvote"
            },
            opNum: new SteemOperationNumber(
              22284053,
              52,
              0
            ),
            transactionId: "99ccb1ce60013fea55ea0a82994f6db186f60050"
          } // Delegator had no such ruleset (name=Upvote, allow author @noisy) at specified datetime
];

export const stage1_0_Rulesets: RulesetsAtMoment = {
        rulesets: [{
            name: "RulesetOneChangesContent",
            voter: "steemprojects1",
            total_weight: 1,
            action: "upvote",
            rules: [
                {
                    type: "tags",
                    mode: "require",
                    tags: ["steemprojects"]
                },
                {
                    type: "authors",
                    mode: "allow",
                    authors: ["noisy"]
                }
            ]
        },
        {
            name: "RulesetTwoWillBeRemoved",
            voter: "steemprojects1",
            total_weight: 1,
            action: "upvote",
            rules: [
                {
                    type: "authors",
                    mode: "allow",
                    authors: ["perduta"]
                }
            ]
        }],
        opNum: new SteemOperationNumber(22314369, 14, 0),
        validityUntil: new SteemOperationNumber(22315016, 34, 0)
};
export const stage1_0_RulesetsUsername: string = "steemprojects2";


export const stage1_1_ValidVoteorders: VoteorderAtMoment [] = [
    {
        voter: "steemprojects1",
        voteorder: {
            ruleset_name: "RulesetOneChangesContent",
            delegator: "steemprojects2",
            type: "upvote",
            weight: 1,
            author: "noisy",
            permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page"
        },
        transactionId: "7b4fec6f3162b2d0e14601112b71611365fe9d16",
        opNum: new SteemOperationNumber(22314497, 0, 1)
    },
    {
        voter: "steemprojects1",
        voteorder: {
            ruleset_name: "RulesetTwoWillBeRemoved",
            delegator: "steemprojects2",
            type: "upvote",
            weight: 1,
            author: "perduta",
            permlink: "do-you-feel-connected-to-your-home-country"
        },
        transactionId: "f2e3cd1ef379092ab617acc664c787a91dd98632",
        opNum: new SteemOperationNumber(22314503, 6, 1)
    }
];

export const stage1_1_InvalidVoteorders: VoteorderAtMoment [] = [
    {
        voter: "steemprojects1",
        voteorder: {
            ruleset_name: "RulesetTwoWillBeRemoved",
            delegator: "steemprojects2",
            type: "upvote",
            weight: 1,
            author: "steemit",
            permlink: "firstpost"
        },
        transactionId: "c0022318524e0a073de1725734732a11fed4df0b",
        opNum: new SteemOperationNumber(22314589, 7, 1)
    }
];

// voteorders were synced and confirmed

export const stage1_2_SyncConfirmationMoment = new SteemOperationNumber(22314624, 5, 2);
export const stage1_2_SyncConfirmationTransactionId: string = "05d2d2a73470529a9b60d86ce17c3fa94b96c816";


/**
 * STAGE 2
 * STAGE 2
 * STAGE 2
 * STAGE 2
 * STAGE 2
 */
export const stage2_0_MistakenRulesetsOpNum: SteemOperationNumber = new SteemOperationNumber(22315016, 34, 0);

export const stage2_0_MistakenVoteordersTransactionIds: string [] = [
    "c0022318524e0a073de1725734732a11fed4df0b"
];


export const stage2_1_Rulesets: RulesetsAtMoment = {
    rulesets: [{
        name: "RulesetOneChangesContent",
        voter: "steemprojects1",
        total_weight: 10,
        action: "upvote",
        rules: [
            {
                type: "tags",
                mode: "require",
                tags: ["steemprojects"]
            },
            {
                type: "authors",
                mode: "deny",
                authors: ["noisy"]
            }
        ]
    }],
    opNum: new SteemOperationNumber(22360354, 56, 0),
    validityUntil: new SteemOperationNumber(22362947, 43, 0)
}; // tx_id = 81922b5f466a68035b80dcce1fefada31112944d

export const stage2_2_ValidVoteorders: VoteorderAtMoment [] = [
    {
        voter: "steemprojects1",
        voteorder: {
            ruleset_name: "RulesetOneChangesContent",
            delegator: "steemprojects2",
            type: "upvote",
            weight: 10,
            author: "pojan",
            permlink: "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad"
        },
        transactionId: "64043d87fea08663b5578fbab2c5114a3176a04f",
        opNum: new SteemOperationNumber(22362844, 37, 1)
    }
];

export const stage2_2_InvalidVoteorders: VoteorderAtMoment [] = [
    {
        voter: "steemprojects1",
        voteorder: {
            ruleset_name: "RulesetOneChangesContent",
            delegator: "steemprojects2",
            type: "upvote",
            weight: 1,
            author: "noisy",
            permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page"
        },
        transactionId: "ca56e27b497f87c3060cd718ea3694c30e03ee08",
        opNum: new SteemOperationNumber(22359948, 30, 1)
    },
    {
        voter: "steemprojects1",
        voteorder: {
            ruleset_name: "RulesetTwoWillBeRemoved",
            delegator: "steemprojects2",
            type: "upvote",
            weight: 5,
            author: "perduta",
            permlink: "do-you-feel-connected-to-your-home-country"
        },
        transactionId: "6dd0d274baefaac4ad18706e649413ac2ec40e39",
        opNum: new SteemOperationNumber(22360064, 32, 1)
    },
    {
        voter: "steemprojects1",
        voteorder: {
            ruleset_name: "RulesetTwoWillBeRemoved",
            delegator: "steemprojects2",
            type: "upvote",
            weight: 5,
            author: "steemit",
            permlink: "firstpost"
        },
        transactionId: "756bd0fdec03573a76bb78f6b7fee2c599f17bca",
        opNum: new SteemOperationNumber(22360067, 42, 1)
    }
];

export const stage2_3_VoteordersSentMoment = new SteemOperationNumber(22362844, 38 /* moment after they are sent */, 1);

export const stage3_0_Rulesets: RulesetsAtMoment = {
    rulesets: [], // disallow voting
    opNum: new SteemOperationNumber(22362947, 43, 0),
    validityUntil: SteemOperationNumber.FUTURE
};

export const stage3_1_SyncConfirmationMoment = new SteemOperationNumber(22389679, 24, 1);
export const stage3_1_SyncConfirmationTransactionId: string = "cdaaf8da87a5a3f4ffa44c9123454d8361bab979";