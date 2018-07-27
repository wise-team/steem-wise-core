import { DirectBlockchainApi, SteemTransaction } from "../../src/wise";
import * as Bluebird from "bluebird";
import * as steem from "steem";
import * as fs from "fs";

import { SteemPost } from "../../src/blockchain/SteemPost";
import { AccountInfo } from "../../src/blockchain/AccountInfo";
import { DynamicGlobalProperties } from "../../src/blockchain/DynamicGlobalProperties";
import { SteemJsAccountHistorySupplier } from "../../src/api/directblockchain/SteemJsAccountHistorySupplier";
import { OperationNumberFilter } from "../../src/chainable/filters/OperationNumberFilter";
import { V1Handler } from "../../src/protocol/versions/v1/V1Handler";
import { SimpleTaker } from "../../src/chainable/Chainable";
import { FakeApi } from "../../src/api/FakeApi";
import { BlogEntry } from "../../src/blockchain/BlogEntry";

const outFilePath = __dirname + "/../data/fake-blockchain.json";

const usernames: string [] = [
    "steemprojects1",
    "steemprojects2",
    "steemprojects3",
    "guest123",
    "noisy",
    "perduta",
    "jblew"
];

const postLinks: [string, string][] = [
    ["noisy", "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that"],
    ["noisy", "7nw1oeev"],
    ["urbangladiator", "hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem"],
    ["steemit", "firstpost"],
    ["pojan", "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad"],
    ["noisy", "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page"],
    ["perduta", "game-that-i-fall-in-love-with-as-developer"],
    ["cryptoctopus", "steemprojects-com-a-project-we-should-all-care-about-suggestions"],
    ["nmax83", "steemprojects-com-sebuah-proyek-yang-seharusnya-kita-semua-peduli-tentang-saran-e78b56ef99562"],
    ["tanata", "man-of-steel"],
    ["noisy", "public-and-private-keys-how-to-generate-all-steem-user-s-keys-from-master-password-without-a-steemit-website-being-offline"],
    ["phgnomo", "steem-project-of-the-week-1-get-on-steem"],
    ["perduta", "do-you-feel-connected-to-your-home-country"],
];

let posts: SteemPost [] = [];
let accounts: AccountInfo [] = [];
let dynamicGlobalProperties: DynamicGlobalProperties | undefined = undefined;
let transactions: SteemTransaction [] = [];
let blogEntries: BlogEntry [] = [];

const api = new DirectBlockchainApi("", "");

// load posts
Bluebird.resolve(postLinks).map((link: [string, string]) => {
    return api.loadPost(link[0], link[1]);
})
.then((values: SteemPost []) => {
    posts = values;
})

// load account info
.then(() => usernames)
.map((username: string) => {
    return api.getAccountInfo(username);
})
.then((values: AccountInfo []) => {
    accounts = values;
})

// load dynamic global properties
.then(() => {
    return api.getDynamicGlobalProperties();
})
.then((value: DynamicGlobalProperties) => {
    dynamicGlobalProperties = value;
})

// load transactions
.then(() => usernames) // for each username return a promise that returns transactions
.map((username: string) => {
    return new Bluebird<SteemTransaction []>((resolve, reject) => {
        const trxs: SteemTransaction [] = [];
        new SteemJsAccountHistorySupplier(steem, username)
        .branch((historySupplier) => {
            historySupplier
            .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_SMARTVOTES_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of smartvotes presence)
            .chain(new SimpleTaker((trx: SteemTransaction): boolean => {
                trxs.push(trx);
                return true;
            }))
            .catch((error: Error) => {
                console.error(error);
                return false;
            });
        })
        .start(() => {
            resolve(trxs);
        });
    });
})
.then((values: SteemTransaction [][]) => {
    return values.reduce((allTrxs: SteemTransaction [], nextTrxs: SteemTransaction []) => allTrxs.concat(nextTrxs));
})
.then((trxs: SteemTransaction []) => {
    transactions = trxs;
})

// load blog entries
.then(() => usernames)
.map((username: string) => {
    return api.getBlogEntries(username, 0, 500);
})
.then((values: BlogEntry [][]) => {
    return values.reduce((allEntries: BlogEntry [], nextEntries: BlogEntry []) => allEntries.concat(nextEntries));
})
.then((blogEntries_: BlogEntry []) => {
    blogEntries = blogEntries_;
})

// save
.then(() => {
    if (!dynamicGlobalProperties) throw new Error("Dynamic global properties are undefined");

    const dataset: FakeApi.Dataset = {
        dynamicGlobalProperties: dynamicGlobalProperties,
        accounts: accounts,
        transactions: transactions,
        posts: posts,
        blogEntries: blogEntries
    };
    fs.writeFileSync(outFilePath, JSON.stringify(dataset));
})
.then(() => {
    console.log("Saved to " + outFilePath);
})
.catch((error: Error) => console.error(error));