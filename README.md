# Steem WISE (core library)


<!--§ data.config.repository.readme.generateDefaultBadges(data) §-->
[![npm](https://img.shields.io/npm/v/steem-wise-core.svg?style=flat-square)](https://www.npmjs.com/package/steem-wise-core) [![License](https://img.shields.io/github/license/wise-team/steem-wise-core.svg?style=flat-square)](https://github.com/wise-team/steem-wise-core/blob/master/LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) [![Chat](https://img.shields.io/badge/chat%20on%20discord-6b11ff.svg?style=flat-square)](https://discordapp.com/invite/CwxQDbG) [![Wise operations count](https://img.shields.io/badge/dynamic/json.svg?label=wise%20operations%20count&url=http%3A%2F%2Fsql.wise.vote%3A%2Foperations%3Fselect%3Dcount&query=%24%5B0%5D.count&colorB=blue&style=flat-square)](http://sql.wise.vote/operations?select=moment,delegator,voter,operation_type&order=moment.desc)
<!--§§.-->



Vote delegation system for STEEM blockchain: common library for browser & node. Wise allows you to securely grant other users your voting power under conditions specified by you.

Important links:

- [Wise home page](https://noisy-witness.github.io/steem-wise-manual/)
- [Voting page](https://wise.vote/)  — how to vote
- [Daemon installation](https://noisy-witness.github.io/steem-wise-manual/installation) — how to delegate
- [Wise manual](https://noisy-witness.github.io/steem-wise-manual/introduction) — details about wise



## How does WISE work?

In short: WISE allows you to delegate your vote under **strictly defined criteria**.

For example, you know that @andrejcibik is a great web designer. Thanks to WISE, you can give him the opportunity to use your vote:

- in a safe way
- under strictly defined rules (the post must meet the rules you had set). In this case, you will allow to use your vote only for posts with the # design tag.
- with limited voting power

How is this possible? Using WISE, you place on Steem blockchain the rules under which @andrejcibik can use your vote. In the meanwhile, you run a daemon, which iterates blockchain head waiting for a voteorder from @andrejcibik to emerge. When the daemon encounters the voteorder — it performs validation. It checks if the post and weight in the order meet the criteria set previously in the rules. If the result of the validation is positive — daemon casts a vote. If not — a custom_json with information on rejection is posted to the blockchain. / _More info in [manual](https://noisy-witness.github.io/steem-wise-manual/introduction)._



### Definitions

- **Delegator** — a user who owns the voting power and allows the voter to use it.
- **Voter** — a user who votes using the account of the delegator (with delegator's voting power)
- **Daemon** — a service that is running on delegator's server, that receives vote orders sent by the voter and decides weather to vote as the voter asked, or to reject the voteorder.
- ***Wise platform*** *(planned)* — an alternative to the daemon, which allows a user to be a delegator without setting up the daemon (instead the daemon is operated by us). Wise platform is under development now.
- **Ruleset** — named set of rules under which specified voter can vote with the delegator's account. Ruleset has a name, has a voter defined and has zero or more rules specified.
- **Voteorder** — a request from the voter to the delegator to vote for a given post. Contains name of the ruleset, author and permlink of the post.



## The WISE protocol

Wise puts all of its data on Steem blockchain. There is no other way of exchanging messages. It uses a carefoully designed [protocol](https://github.com/noisy-witness/steem-wise-core/tree/master/src/protocol/versions), which has versioning enabled, and is already oriented for future development. (_[Here](https://github.com/noisy-witness/steem-wise-core/tree/master/src/protocol/versions/v2) you can find both typescript definitions and a JSON schema of the protocol._)

Wise publishes the messages to the blockchain as `custom_json` operations. There are three types of messages that wise puts on the blockchain:

- set_rules — allows a delegator to specify one or more sets of rules under which a voter can use voting power of the delegator.
- send_voteorder — the voter asks the delegator's daemon to vote for a given post under specified set of rules (a ruleset)
- confirm_vote — contains confirmation that the delegator voted for the post, or a rejection with a message why the voteorder was rejected (which rule was not fulfilled and why).



## Structure of the Wise project

Wise has several tools and is divided in the following way:

- [steem-wise-core](https://github.com/noisy-witness/steem-wise-core) *(This repository)* — the core library that contains code that is shared among all other packages. Can be used separately in third party projects.
- [steem-wise-cli](https://github.com/noisy-witness/steem-wise-cli) — the command-line tool. Allows performing all wise operations, but is mostly used to synchronise the rules (kept in file) and run the daemon.
- [steem-wise-voter-page](https://github.com/noisy-witness/steem-wise-voter-page) — an online tool that allows to vote using Wise. Online version here: [https://wise.vote/](https://wise.vote/).
- [steem-wise-sql](https://github.com/noisy-witness/steem-wise-sql) — an up-to-date database with REST api that contains all wise operations. Link to online version of the api is in the repository of steem-wise-sql.
- [steem-wise-manual](https://github.com/noisy-witness/steem-wise-manual) — a manual. Online version: [https://noisy-witness.github.io/steem-wise-manual](https://noisy-witness.github.io/steem-wise-manual)
- [steem-wise-test](https://github.com/noisy-witness/steem-wise-test) — integration & system tests for Wise

*[See all our repositories](https://github.com/noisy-witness).*



## How to use the library in your project

Add this library to your npm project:

```bash
$ npm install --save steem-wise-core
```

Send voteorder:

```js
let wise = require('steem-wise-core');

let voter = "jblew";
let postingWif = "...";
let voterWise = new wise.Wise(voter, new wise.DirectBlockchainApi(postingWif));

let delegator = "noisy";
let voteorder = {
    rulesetName: "co robia lekarze w kuchni? Leczo!",
    author: "article-author",
    permlink: "article-permlink",
    weight: 10000
};
voterWise.sendVoteorderAsync(delegator, voteorder)
.then(moment => console.log("Voteorder sent in block " + moment.blockNum))
.catch(error => console.error(error));
```



<!--§ data.config.repository.readme.generateHelpMd(data) §-->
## Where to get help?

- Feel free to talk with us on our chat: {https://discordapp.com/invite/CwxQDbG} .
- You can read [The Wise Manual]({https://wise.vote/introduction})
- You can also contact Jędrzej at jedrzejblew@gmail.com (if you think that you found a security issue, please contact me quickly).

You can also ask questions as issues in appropriate repository: See [issues for this repository](https://github.com/wise-team/steem-wise-core/issues).

<!--§§.-->


<!--§ data.config.repository.readme.generateHelpUsMd(data) §-->
## Contribute to steem Wise

We welcome warmly:

- Bug reports via [issues](https://github.com/wise-team/steem-wise-core).
- Enhancement requests via via [issues](https://github.com/wise-team/steem-wise-core/issues).
- [Pull requests](https://github.com/wise-team/steem-wise-core/pulls)
- Security reports to _jedrzejblew@gmail.com_.

**Before** contributing please **read [Wise CONTRIBUTING guide](https://github.com/wise-team/steem-wise-core/blob/master/CONTRIBUTING.md)**.

Thank you for developing WISE together!



## Like the project? Let @wise-team become your favourite witness!

If you use & appreciate our software — you can easily support us. Just vote for "wise-team" to become you one of your witnesses. You can do it here: [https://steemit.com/~witnesses](https://steemit.com/~witnesses).

<!--§§.-->

<!-- Prayer: Gloria Patri, et Filio, et Spiritui Sancto, sicut erat in principio et nunc et semper et in saecula saeculorum. Amen. In te, Domine, speravi: non confundar in aeternum. -->
