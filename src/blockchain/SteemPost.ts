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
    ...
  ],
  "replies": [],
  "author_reputation": "41380195202133",
  "promoted": "0.000 STEEM",
  "body_length": 0,
  "reblogged_by": []
}
*/