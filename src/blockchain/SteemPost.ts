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

/* Example:
{
  "id": 48010311,
  "author": "noisy",
  "permlink": "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that",
  "category": "steem",
  "parent_author": "",
  "parent_permlink": "steem",
  "title": "Whales, please consider declining all comment rewards by default (in settings). 5 reasons to do that!",
  "body": "![Selection_051.png](https://steemitimages.com/DQmYcSFdqmLWxbCizRkQn1cL9Te3nKmRi6rJRJguSU2kKkX/Selection_051.png)\n\nDeclining a payout from a comment was possible even earlier, however it was always difficult to do that without some programming skills. Now it is super easy. \n\n1. Go to `https://steemit.com/@<your_nick>/settings\n2. Change _\"Comment post rewards\"_ to  _\"Decline Payout\"_ <br>No need to save, it saves automatically\n\n![decline.gif](https://steemitimages.com/DQmWwNGKqW7zWN73uP4D7h6any3QLNU7gyWW1RLQo4jQmtV/decline.gif)\n\n# Why I believe some people should decline comment payouts\n\n1. Let's face is. If you are a whale, and you have 100 000 or more SteemPower, typical earnings from comments will not make a big difference for you anyway.\n2. However, this can make a difference for smaller accounts, because there will be more STEEM in reward pool to reward them\n3. IMO, when someone upvotes own comment, a perception of such behavior is mixed. For example, when you will like your own post on facebook, people very often imagine this:\n\n\n<center>\n![Selection_048.png](https://steemitimages.com/DQmPDfG9ZCxqtYDEGA2J6GdwRaVfLdoRz6bha2zHqCjhA8J/Selection_048.png)\n</center>\n\nThis is not only my opinion, this is how people see it (according to google images):\n\n<center>\n![Selection_049.png](https://steemitimages.com/DQmX6vzVW2WVtsNvUAjWdxG1f5EjfcWS8qUgnY379yarqUg/Selection_049.png)\n</center>\n\nDo you think perception on Steemit is much different? I don't think so!\n\n# Does it mean, that upvoting own comments are generally bad?\n\nFirst of all, this cannot be so easily generalized. If you have a lot of SteemPower, you have a right to use all privileges which blockchain gives you.\n\n**Personally I upvote own comments from time to time**, but in all cases, I'm doing that not because I am want to get few extra $, but because I want to be seen. I want to make my comment more visible because I think I have something important to say to the people.\n\nThe problem with that approach was, that it was really difficult and inconvenient to decline comment payouts with some programming tools, and also... I was always afraid, that people will think, that I was greedy. To eliminate this impression, very often I've canceled my upvote, after I got enough upvotes from other people. But that was even more problematic, because I needed to  monitor my old comments, to not forgets to unvote myself.\n\n# Still not convinced?\n\nI hope, that my intentions are clear - I want to support minnows, but the great thing is, that you do not have to be so altruistic to came to conclusion, that currently disabling comment payout **is a great thing to stand out**!\n\n![Selection_050.png](https://steemitimages.com/DQmUxw8QHqSVWQEBZaNNJD8XXUbuAkXr1k8zTRGjnwXBjtw/Selection_050.png)\n\nSome people still do not know how to do that. For them, you will be like a pro, which can do something, what other people can't. People will more often take a look on your profile, to learn more about you.\n\n---------- \n\n# Conclusion\n\nI really think this is a good idea, to decline rewards by default. If I will make a really long and hard to prepare comment, I always can change this setting very easily.\n\nI'm also pretty sure, that thanks to that feature, I will actually use my SteemPower more often as a leverage, to increase visibility in threads which are super important to me. I will not be afraid, that upvoting my comments will be seen by other people as greedy behavior.\n\nPersonally, I would not be surprised if that would help increase value of STEEM significantly. Why? Because large STEEM investors more often will speak at loud, what is important to them. If those people will be heard, maybe they will keep STEEM in their portfolio for a little bit longer.\n\n-------------\n\n<sub><sup>Please consider voting for `noisy.witness` - Soon you can expect from us a proper announcement  with all the details about our node, together with info about our upcoming project _SmartVotes_ :) But actually people can vote for us even right now, since our node is up and running smoothly :)</sup></sub>",
  "json_metadata": "{\"tags\":[\"steem\",\"steemit\",\"voting\"],\"image\":[\"https://steemitimages.com/DQmYcSFdqmLWxbCizRkQn1cL9Te3nKmRi6rJRJguSU2kKkX/Selection_051.png\",\"https://steemitimages.com/DQmWwNGKqW7zWN73uP4D7h6any3QLNU7gyWW1RLQo4jQmtV/decline.gif\",\"https://steemitimages.com/DQmPDfG9ZCxqtYDEGA2J6GdwRaVfLdoRz6bha2zHqCjhA8J/Selection_048.png\",\"https://steemitimages.com/DQmX6vzVW2WVtsNvUAjWdxG1f5EjfcWS8qUgnY379yarqUg/Selection_049.png\",\"https://steemitimages.com/DQmUxw8QHqSVWQEBZaNNJD8XXUbuAkXr1k8zTRGjnwXBjtw/Selection_050.png\"],\"links\":[\"https://steemit.com/@&lt;your_nick\"],\"app\":\"steemit/0.1\",\"format\":\"markdown\"}",
  "last_update": "2018-05-12T07:06:18",
  "created": "2018-05-11T04:23:24",
  "active": "2018-06-17T21:43:12",
  "last_payout": "2018-05-18T04:23:24",
  "depth": 0,
  "children": 73,
  "net_rshares": 0,
  "abs_rshares": 0,
  "vote_rshares": 0,
  "children_abs_rshares": 0,
  "cashout_time": "1969-12-31T23:59:59",
  "max_cashout_time": "1969-12-31T23:59:59",
  "total_vote_weight": 0,
  "reward_weight": 10000,
  "total_payout_value": "42.552 SBD",
  "curator_payout_value": "10.882 SBD",
  "author_rewards": 14832,
  "net_votes": 104,
  "root_author": "noisy",
  "root_permlink": "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that",
  "max_accepted_payout": "1000000.000 SBD",
  "percent_steem_dollars": 10000,
  "allow_replies": true,
  "allow_votes": true,
  "allow_curation_rewards": true,
  "beneficiaries": [],
  "url": "/steem/@noisy/dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that",
  "root_title": "Whales, please consider declining all comment rewards by default (in settings). 5 reasons to do that!",
  "pending_payout_value": "0.000 SBD",
  "total_pending_payout_value": "0.000 STEEM",
  "active_votes": [
    {
      "voter": "ajvest",
      "weight": 56182,
      "rshares": "181800312334",
      "percent": 10000,
      "reputation": "13161745138394",
      "time": "2018-05-11T04:29:54"
    },
    {
      "voter": "chris4210",
      "weight": 106969,
      "rshares": "288220570957",
      "percent": 10000,
      "reputation": "39678195728248",
      "time": "2018-05-11T04:46:45"
    },
    {
      "voter": "mod-tamichh",
      "weight": 27751,
      "rshares": "116395740055",
      "percent": 10000,
      "reputation": "1640246077834",
      "time": "2018-05-11T06:46:18"
    },
    {
      "voter": "schro",
      "weight": 964,
      "rshares": 2022466754,
      "percent": 10000,
      "reputation": "5439139781025",
      "time": "2018-05-11T05:00:42"
    },
    {
      "voter": "lukestokes",
      "weight": 429620,
      "rshares": "3042075123455",
      "percent": 10000,
      "reputation": "256400583066000",
      "time": "2018-05-12T17:57:48"
    },
    {
      "voter": "okkiedot",
      "weight": 27686,
      "rshares": "58061221806",
      "percent": 10000,
      "reputation": "16410502535248",
      "time": "2018-05-11T05:05:15"
    },
    {
      "voter": "ausbitbank",
      "weight": 243461,
      "rshares": "1021148426813",
      "percent": 2000,
      "reputation": "175284787298869",
      "time": "2018-05-11T05:22:03"
    },
    {
      "voter": "jesusbatallar",
      "weight": 706,
      "rshares": "5926727562",
      "percent": 10000,
      "reputation": "4615843578059",
      "time": "2018-05-13T19:42:24"
    },
    {
      "voter": "lukmarcus",
      "weight": 16694,
      "rshares": "70021547998",
      "percent": 5000,
      "reputation": "6180981993558",
      "time": "2018-05-11T06:43:18"
    },
    {
      "voter": "sisters",
      "weight": 34496,
      "rshares": "44516226790",
      "percent": 5000,
      "reputation": "6592016758649",
      "time": "2018-05-11T04:29:21"
    },
    {
      "voter": "fabien",
      "weight": 598000,
      "rshares": "2508192678525",
      "percent": 10000,
      "reputation": "5707171657723",
      "time": "2018-05-11T06:24:03"
    },
    {
      "voter": "drbec",
      "weight": 79,
      "rshares": 185199840,
      "percent": 10000,
      "reputation": 2146945071,
      "time": "2018-05-11T04:50:21"
    },
    {
      "voter": "timcliff",
      "weight": 209497,
      "rshares": "527509638413",
      "percent": 7500,
      "reputation": "206736874223905",
      "time": "2018-05-11T04:38:57"
    },
    {
      "voter": "ekitcho",
      "weight": 831662,
      "rshares": "2547395099774",
      "percent": 10000,
      "reputation": "9590198462073",
      "time": "2018-05-11T05:06:36"
    },
    {
      "voter": "steevc",
      "weight": 3261,
      "rshares": "13678775328",
      "percent": 400,
      "reputation": "125681907381120",
      "time": "2018-05-11T05:59:15"
    },
    {
      "voter": "uwelang",
      "weight": 11010,
      "rshares": "92360557747",
      "percent": 1000,
      "reputation": "179578577547840",
      "time": "2018-05-14T19:56:54"
    },
    {
      "voter": "allyouneedtoknow",
      "weight": 18275,
      "rshares": "76651408993",
      "percent": 7500,
      "reputation": "7236879784252",
      "time": "2018-05-11T08:06:33"
    },
    {
      "voter": "joep",
      "weight": 33,
      "rshares": 70171790,
      "percent": 10000,
      "reputation": 806042,
      "time": "2018-05-11T04:38:27"
    },
    {
      "voter": "awesomenyl",
      "weight": 343,
      "rshares": 926497252,
      "percent": 2000,
      "reputation": "95692181885422",
      "time": "2018-05-11T04:46:42"
    },
    {
      "voter": "dylanhobalart",
      "weight": 353,
      "rshares": 902977385,
      "percent": 1000,
      "reputation": "13925147469951",
      "time": "2018-05-11T04:29:33"
    },
    {
      "voter": "techslut",
      "weight": 7089,
      "rshares": "29733861038",
      "percent": 1000,
      "reputation": "53113159922651",
      "time": "2018-05-11T08:37:42"
    },
    {
      "voter": "knittybynature",
      "weight": 3808,
      "rshares": "15973803160",
      "percent": 5000,
      "reputation": "15527873510195",
      "time": "2018-05-11T07:27:48"
    },
    {
      "voter": "jamzed",
      "weight": 11111,
      "rshares": "23301131112",
      "percent": 10000,
      "reputation": "2057064859905",
      "time": "2018-05-11T04:54:30"
    },
    {
      "voter": "schererf",
      "weight": 1839,
      "rshares": "7712169309",
      "percent": 1000,
      "reputation": "21677045702924",
      "time": "2018-05-12T05:59:00"
    },
    {
      "voter": "edb",
      "weight": 1451,
      "rshares": "6087285599",
      "percent": 2000,
      "reputation": "2454839838839",
      "time": "2018-05-11T08:16:03"
    },
    {
      "voter": "personz",
      "weight": 2690,
      "rshares": "22562058014",
      "percent": 10000,
      "reputation": "35192655052246",
      "time": "2018-05-14T14:20:51"
    },
    {
      "voter": "steemcenterwiki",
      "weight": 498,
      "rshares": 1339646062,
      "percent": 2000,
      "reputation": "4821701033523",
      "time": "2018-05-11T04:46:48"
    },
    {
      "voter": "fintechresearch",
      "weight": 509,
      "rshares": 4266234421,
      "percent": 10000,
      "reputation": "2188374131456",
      "time": "2018-05-13T19:42:30"
    },
    {
      "voter": "titoortiz",
      "weight": 635,
      "rshares": 1669629640,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:47:21"
    },
    {
      "voter": "bargolis",
      "weight": 6398,
      "rshares": "13416942284",
      "percent": 10000,
      "reputation": "1166477440902",
      "time": "2018-05-11T04:53:30"
    },
    {
      "voter": "schro.one",
      "weight": 92,
      "rshares": 193684789,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:54:18"
    },
    {
      "voter": "mys",
      "weight": 19629,
      "rshares": "41165920860",
      "percent": 5000,
      "reputation": "7380751911232",
      "time": "2018-05-11T04:55:33"
    },
    {
      "voter": "jakipatryk",
      "weight": 13111,
      "rshares": "54989635894",
      "percent": 10000,
      "reputation": "11260293171052",
      "time": "2018-05-11T10:58:18"
    },
    {
      "voter": "steemitromney",
      "weight": 846,
      "rshares": "7102199331",
      "percent": 10000,
      "reputation": "1323286472910",
      "time": "2018-05-13T03:19:36"
    },
    {
      "voter": "diogogomes",
      "weight": 41,
      "rshares": 170559913,
      "percent": 7800,
      "reputation": 0,
      "time": "2018-05-11T05:54:39"
    },
    {
      "voter": "scooter77",
      "weight": 770,
      "rshares": "6454991581",
      "percent": 2500,
      "reputation": "44377588450027",
      "time": "2018-05-12T23:52:15"
    },
    {
      "voter": "aditor",
      "weight": 3367,
      "rshares": "14119844392",
      "percent": 10000,
      "reputation": "3280965824034",
      "time": "2018-05-11T11:52:30"
    },
    {
      "voter": "dzejkob",
      "weight": 146,
      "rshares": 614503785,
      "percent": 10000,
      "reputation": 2683324154,
      "time": "2018-05-12T08:23:45"
    },
    {
      "voter": "drakos",
      "weight": 77207,
      "rshares": "323828195150",
      "percent": 2000,
      "reputation": "47196994525508",
      "time": "2018-05-11T05:17:24"
    },
    {
      "voter": "saunter",
      "weight": 9632,
      "rshares": "20199739843",
      "percent": 10000,
      "reputation": "5621762833014",
      "time": "2018-05-11T04:54:51"
    },
    {
      "voter": "roxane",
      "weight": 15891,
      "rshares": "133303864607",
      "percent": 1000,
      "reputation": "126167127976878",
      "time": "2018-05-16T20:29:36"
    },
    {
      "voter": "jaraumoses",
      "weight": 4698,
      "rshares": "19707139236",
      "percent": 3100,
      "reputation": "10513904475310",
      "time": "2018-05-11T05:54:57"
    },
    {
      "voter": "augustowska",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": "80897252215",
      "time": "2018-06-27T12:28:03"
    },
    {
      "voter": "grecki-bazar-ewy",
      "weight": 9384,
      "rshares": "39358190117",
      "percent": 10000,
      "reputation": "3637206822081",
      "time": "2018-05-11T07:44:54"
    },
    {
      "voter": "marwa",
      "weight": 687,
      "rshares": 2882955808,
      "percent": 10000,
      "reputation": "333095940650",
      "time": "2018-05-11T06:53:03"
    },
    {
      "voter": "petecko",
      "weight": 3591,
      "rshares": "15061673710",
      "percent": 10000,
      "reputation": "2610862863465",
      "time": "2018-05-11T07:20:51"
    },
    {
      "voter": "alcik",
      "weight": 1962,
      "rshares": "8227311281",
      "percent": 10000,
      "reputation": "737546342437",
      "time": "2018-05-11T06:03:51"
    },
    {
      "voter": "breadcentric",
      "weight": 3617,
      "rshares": "15172817612",
      "percent": 10000,
      "reputation": "2957912072836",
      "time": "2018-05-11T16:22:21"
    },
    {
      "voter": "shintamonica",
      "weight": 23,
      "rshares": 64246578,
      "percent": 10000,
      "reputation": "965772248855",
      "time": "2018-05-11T04:34:45"
    },
    {
      "voter": "risingfox",
      "weight": 102,
      "rshares": 427453943,
      "percent": 10000,
      "reputation": "94403462706",
      "time": "2018-05-11T06:18:57"
    },
    {
      "voter": "m-san",
      "weight": 370,
      "rshares": 1555313493,
      "percent": 10000,
      "reputation": "539022273979",
      "time": "2018-05-11T19:19:30"
    },
    {
      "voter": "bartosz546",
      "weight": 4768,
      "rshares": "16214832298",
      "percent": 10000,
      "reputation": "3475987266189",
      "time": "2018-05-11T04:41:54"
    },
    {
      "voter": "gradzio",
      "weight": 2877,
      "rshares": 1061484756,
      "percent": 10000,
      "reputation": "1580190417045",
      "time": "2018-05-11T04:26:03"
    },
    {
      "voter": "polscykierowcy",
      "weight": 435,
      "rshares": 1822303333,
      "percent": 10000,
      "reputation": "878708614481",
      "time": "2018-05-11T07:11:39"
    },
    {
      "voter": "fknmayhem",
      "weight": 618,
      "rshares": 2590124510,
      "percent": 5000,
      "reputation": "17231354851763",
      "time": "2018-05-11T10:41:18"
    },
    {
      "voter": "bocik",
      "weight": 3281,
      "rshares": "7895269755",
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:49:33"
    },
    {
      "voter": "gorzelapiotr",
      "weight": 1306,
      "rshares": "10952398283",
      "percent": 10000,
      "reputation": "723199756154",
      "time": "2018-05-17T10:38:33"
    },
    {
      "voter": "astromaniak",
      "weight": 1859,
      "rshares": "7795939998",
      "percent": 2000,
      "reputation": "4363454012429",
      "time": "2018-05-11T21:07:54"
    },
    {
      "voter": "iqbalrampago",
      "weight": 2407,
      "rshares": 860610356,
      "percent": 10000,
      "reputation": "575370058919",
      "time": "2018-05-11T04:28:54"
    },
    {
      "voter": "jasiu",
      "weight": 137,
      "rshares": 573026994,
      "percent": 10000,
      "reputation": "1616685900168",
      "time": "2018-05-11T08:15:57"
    },
    {
      "voter": "domin0112",
      "weight": 143,
      "rshares": 599458743,
      "percent": 10000,
      "reputation": 65144808,
      "time": "2018-05-11T16:30:51"
    },
    {
      "voter": "thedragonnis",
      "weight": 939,
      "rshares": 3938110889,
      "percent": 10000,
      "reputation": "610591917430",
      "time": "2018-05-12T11:35:24"
    },
    {
      "voter": "kryptojanusz",
      "weight": 3216,
      "rshares": "13486446436",
      "percent": 10000,
      "reputation": "734878538370",
      "time": "2018-05-11T19:14:48"
    },
    {
      "voter": "mickson",
      "weight": 55,
      "rshares": 458274785,
      "percent": 7500,
      "reputation": 2433324790,
      "time": "2018-05-13T14:59:30"
    },
    {
      "voter": "wrestlingworld",
      "weight": 173,
      "rshares": 722986670,
      "percent": 10000,
      "reputation": "402058760307",
      "time": "2018-05-11T05:52:03"
    },
    {
      "voter": "barteksekski1",
      "weight": 72,
      "rshares": 602505045,
      "percent": 10000,
      "reputation": -13409058450,
      "time": "2018-05-13T11:15:54"
    },
    {
      "voter": "a-dalora",
      "weight": 980,
      "rshares": 4113084814,
      "percent": 5000,
      "reputation": "600962575581",
      "time": "2018-05-11T08:36:15"
    },
    {
      "voter": "danielw",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": "42371124819",
      "time": "2018-06-09T14:55:21"
    },
    {
      "voter": "fraktale",
      "weight": 3259,
      "rshares": "13668803731",
      "percent": 10000,
      "reputation": "881782459699",
      "time": "2018-05-11T05:38:12"
    },
    {
      "voter": "hitsug",
      "weight": 690,
      "rshares": 2893995848,
      "percent": 10000,
      "reputation": "646905298766",
      "time": "2018-05-11T10:30:54"
    },
    {
      "voter": "reazuliqbal",
      "weight": 1823,
      "rshares": "6501446910",
      "percent": 10000,
      "reputation": "7490125756834",
      "time": "2018-05-11T04:41:03"
    },
    {
      "voter": "properfraction",
      "weight": 118,
      "rshares": 492562438,
      "percent": 10000,
      "reputation": "76557016329",
      "time": "2018-05-12T06:19:54"
    },
    {
      "voter": "kiemon",
      "weight": 135,
      "rshares": 565314087,
      "percent": 10000,
      "reputation": 472883079,
      "time": "2018-05-11T21:14:18"
    },
    {
      "voter": "beleg",
      "weight": 5749,
      "rshares": "15424120354",
      "percent": 10000,
      "reputation": "883922947511",
      "time": "2018-05-11T04:46:51"
    },
    {
      "voter": "pari",
      "weight": 256,
      "rshares": 611616669,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:49:45"
    },
    {
      "voter": "lolek32",
      "weight": 146,
      "rshares": 611423616,
      "percent": 10000,
      "reputation": -2902479273,
      "time": "2018-05-11T08:31:57"
    },
    {
      "voter": "herbacianymag",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": "82893422923",
      "time": "2018-06-12T09:37:06"
    },
    {
      "voter": "rj1",
      "weight": 54,
      "rshares": 162645989,
      "percent": 10000,
      "reputation": "18016733845",
      "time": "2018-05-11T04:34:00"
    },
    {
      "voter": "kacperski",
      "weight": 253,
      "rshares": 575898788,
      "percent": 10000,
      "reputation": "42758094527",
      "time": "2018-05-11T04:51:00"
    },
    {
      "voter": "raorac",
      "weight": 559,
      "rshares": 2346301655,
      "percent": 10000,
      "reputation": "338682617361",
      "time": "2018-05-11T05:20:21"
    },
    {
      "voter": "gbg",
      "weight": 146,
      "rshares": 611127945,
      "percent": 10000,
      "reputation": 1992767589,
      "time": "2018-05-11T07:48:42"
    },
    {
      "voter": "browery",
      "weight": 525,
      "rshares": 1366586028,
      "percent": 10000,
      "reputation": "312079957285",
      "time": "2018-05-11T04:47:36"
    },
    {
      "voter": "rozku",
      "weight": 116,
      "rshares": 485592611,
      "percent": 10000,
      "reputation": "616888685541",
      "time": "2018-05-11T05:28:57"
    },
    {
      "voter": "sunnydream",
      "weight": 122,
      "rshares": 513694793,
      "percent": 10000,
      "reputation": 12695888,
      "time": "2018-05-12T07:07:27"
    },
    {
      "voter": "hisiecho",
      "weight": 241,
      "rshares": 2021785956,
      "percent": 10000,
      "reputation": "378524242128",
      "time": "2018-05-13T19:21:57"
    },
    {
      "voter": "polyhistor",
      "weight": 205,
      "rshares": 429947726,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:53:30"
    },
    {
      "voter": "deus-vult",
      "weight": 99,
      "rshares": 208436862,
      "percent": 10000,
      "reputation": -4033215,
      "time": "2018-05-11T04:38:24"
    },
    {
      "voter": "konradxxx3",
      "weight": 110,
      "rshares": 465390002,
      "percent": 10000,
      "reputation": "813575618355",
      "time": "2018-05-11T05:42:18"
    },
    {
      "voter": "pawelc",
      "weight": 63,
      "rshares": 531190865,
      "percent": 10000,
      "reputation": "30906169878",
      "time": "2018-05-15T17:35:00"
    },
    {
      "voter": "brainchild",
      "weight": 206,
      "rshares": 432001236,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:53:30"
    },
    {
      "voter": "dragonarts",
      "weight": 144,
      "rshares": 603906869,
      "percent": 10000,
      "reputation": "46171825834",
      "time": "2018-05-11T07:57:00"
    },
    {
      "voter": "cryptouru",
      "weight": 1299,
      "rshares": "5451853625",
      "percent": 10000,
      "reputation": "3261711564745",
      "time": "2018-05-11T11:35:18"
    },
    {
      "voter": "rolsonpatison",
      "weight": 124,
      "rshares": 1037374580,
      "percent": 10000,
      "reputation": "2367782927717",
      "time": "2018-05-14T21:42:00"
    },
    {
      "voter": "herm1t",
      "weight": 141,
      "rshares": 587590149,
      "percent": 10000,
      "reputation": 1010824196,
      "time": "2018-05-12T16:35:33"
    },
    {
      "voter": "chromo",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": "262207127763",
      "time": "2018-05-23T20:38:03"
    },
    {
      "voter": "peterglitch",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-06-18T19:47:09"
    },
    {
      "voter": "wmproductions",
      "weight": 151,
      "rshares": 632134678,
      "percent": 10000,
      "reputation": "163845984946",
      "time": "2018-05-11T20:09:15"
    },
    {
      "voter": "filterfield",
      "weight": 194,
      "rshares": 406241939,
      "percent": 10000,
      "reputation": 8977636,
      "time": "2018-05-11T05:01:45"
    },
    {
      "voter": "richestroomba",
      "weight": 25,
      "rshares": 105141512,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T07:27:00"
    },
    {
      "voter": "scribdbloat",
      "weight": 53,
      "rshares": 111254323,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:59:45"
    },
    {
      "voter": "updatedanthology",
      "weight": 53,
      "rshares": 113699471,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:53:06"
    },
    {
      "voter": "amphora",
      "weight": 48,
      "rshares": 113699468,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:50:12"
    },
    {
      "voter": "expectantfig",
      "weight": 57,
      "rshares": 118589679,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-11T04:55:42"
    },
    {
      "voter": "nikos2k17",
      "weight": 102,
      "rshares": 427878760,
      "percent": 10000,
      "reputation": 35484462,
      "time": "2018-05-11T18:20:12"
    },
    {
      "voter": "misiasty",
      "weight": 61,
      "rshares": 513488707,
      "percent": 10000,
      "reputation": 572301531,
      "time": "2018-05-13T11:26:33"
    },
    {
      "voter": "muksaldesaigrafi",
      "weight": 21,
      "rshares": 178141903,
      "percent": 10000,
      "reputation": "1186228544063",
      "time": "2018-05-17T06:42:57"
    },
    {
      "voter": "foremostwiseguy",
      "weight": 68,
      "rshares": 570642090,
      "percent": 10000,
      "reputation": "398566708748",
      "time": "2018-05-13T19:47:42"
    },
    {
      "voter": "somsiat",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": 3975983722,
      "time": "2018-06-06T21:45:51"
    },
    {
      "voter": "ajiestemit",
      "weight": 90,
      "rshares": 378611417,
      "percent": 10000,
      "reputation": 744055300,
      "time": "2018-05-11T07:38:24"
    },
    {
      "voter": "mareqqq",
      "weight": 115,
      "rshares": 485463156,
      "percent": 10000,
      "reputation": -51078362,
      "time": "2018-05-11T21:39:51"
    },
    {
      "voter": "szef0jungle",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": 404233214,
      "time": "2018-05-25T10:38:24"
    },
    {
      "voter": "wideoprezentacje",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": "1478056462793",
      "time": "2018-07-10T23:06:51"
    },
    {
      "voter": "stanlej909",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": 0,
      "time": "2018-05-26T21:21:09"
    },
    {
      "voter": "alirezanatasya",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": "19339532411",
      "time": "2018-06-17T21:42:45"
    },
    {
      "voter": "matima",
      "weight": 0,
      "rshares": 0,
      "percent": 10000,
      "reputation": "69085373448",
      "time": "2018-07-13T19:02:42"
    }
  ],
  "replies": [],
  "author_reputation": "41380195202133",
  "promoted": "0.000 STEEM",
  "body_length": 0,
  "reblogged_by": []
}
*/