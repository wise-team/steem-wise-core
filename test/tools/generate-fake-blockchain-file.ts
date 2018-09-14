/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as steem from "steem";
import * as fs from "fs";

import { DirectBlockchainApi, SteemTransaction } from "../../src/wise";
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
    "jblew",
    "nicniezgrublem"
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
    ["jblew", "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise"],
    ["steemprojects2", "4jxxyd-test"],
    ["jblew", "witajcie-steemianie-przybywam-jedrzej-lewandowski"],
    ["nicniezgrublem", "b52e6300-9011-11e8-b2de-f7be8f055a16"],
    ["steemprojects2", "sttnc-test"],
    ["artemistau", "wielcy-polacy-professor-zbigniew-religa"]
];

let posts: SteemPost [] = [];
let accounts: AccountInfo [] = [];
let dynamicGlobalProperties: DynamicGlobalProperties | undefined = undefined;
let transactions: SteemTransaction [] = [];
let blogEntries: BlogEntry [] = [];

const api = new DirectBlockchainApi("", "", /*{
    transport: "http",
    uri: "https://gtg.steem.house:8090",
    url: "https://gtg.steem.house:8090"
}*/);

Bluebird.resolve()
.then(() => console.log("Loading posts..."))
.then(() => postLinks)
.map((link_: any /* bluebird bug */) => {
    const link = link_ as [string, string];
    return api.loadPost(link[0], link[1]);
})
.then((values: SteemPost []) => {
    posts = values;
})

.then(() => console.log("Loading account infos..."))
.then(() => usernames)
.map((username: any /* bluebird bug */) => {
    return api.getAccountInfo(username);
})
.then((values: AccountInfo []) => {
    accounts = values;
})

.then(() => console.log("Loading dynamic global properties..."))
.then(() => {
    return api.getDynamicGlobalProperties();
})
.then((value: DynamicGlobalProperties) => {
    dynamicGlobalProperties = value;
})

.then(() => console.log("Loading transactions..."))
.then(() => usernames) // for each username return a promise that returns transactions
.mapSeries((username: any  /* bluebird bug */) => {
    return BluebirdBluebirdPromise.delay(2000).then(() => new BluebirdPromise<SteemTransaction []>((resolve, reject) => {
        console.log("Loading transactions of @" + username + "...");
        const trxs: SteemTransaction [] = [];
        new SteemJsAccountHistorySupplier(steem, username)
        .branch((historySupplier) => {
            historySupplier
            .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
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
            console.log("Done loading transactions of @" + username + "...");
            resolve(trxs);
        });
    }));
})
.then((values: SteemTransaction [][]) => {
    return values.reduce((allTrxs: SteemTransaction [], nextTrxs: SteemTransaction []) => allTrxs.concat(nextTrxs));
})
.then((trxs: SteemTransaction []) => {
    transactions = trxs;
})

.then(() => console.log("Loading blog entries..."))
.then(() => usernames)
.map((username: any  /* bluebird bug */) => {
    return api.getBlogEntries(username, 0, 500);
})
.then((values: BlogEntry [][]) => {
    return values.reduce((allEntries: BlogEntry [], nextEntries: BlogEntry []) => allEntries.concat(nextEntries));
})
.then((blogEntries_: BlogEntry []) => {
    blogEntries = blogEntries_;
})

.then(() => console.log("Saving..."))
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