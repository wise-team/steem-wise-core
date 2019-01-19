/* PROMISE_DEF */
import * as BluebirdPromise from "bluebird";
/* END_PROMISE_DEF */
import * as steem from "steem";
import * as fs from "fs";

import { DirectBlockchainApi, UnifiedSteemTransaction, Wise } from "../../wise";
import { SteemJsAccountHistorySupplier } from "../../api/directblockchain/SteemJsAccountHistorySupplier";
import { OperationNumberFilter } from "../../chainable/filters/OperationNumberFilter";
import { V1Handler } from "../../protocol/versions/v1/V1Handler";
import { SimpleTaker } from "../../chainable/Chainable";
import { FakeApi } from "../../api/FakeApi";

const outFilePath = __dirname + "/../data/fake-blockchain.json";

const usernames: string[] = [
    "steemprojects1",
    "steemprojects2",
    "steemprojects3",
    "guest123",
    "noisy",
    "perduta",
    "jblew",
    "nicniezgrublem",
];

const postLinks: [string, string][] = [
    ["noisy", "dear-whales-please-consider-declining-all-comment-rewards-by-default-in-settings-5-reasons-to-do-that"],
    ["noisy", "7nw1oeev"],
    ["urbangladiator", "hyperfundit-a-kickstarter-like-funding-investment-platform-for-steem"],
    ["steemit", "firstpost"],
    ["pojan", "how-to-install-free-cad-on-windows-mac-os-and-linux-and-what-is-free-cad"],
    [
        "noisy",
        "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
    ],
    ["perduta", "game-that-i-fall-in-love-with-as-developer"],
    ["cryptoctopus", "steemprojects-com-a-project-we-should-all-care-about-suggestions"],
    ["nmax83", "steemprojects-com-sebuah-proyek-yang-seharusnya-kita-semua-peduli-tentang-saran-e78b56ef99562"],
    ["tanata", "man-of-steel"],
    [
        "noisy",
        "public-and-private-keys-how-to-generate-all-steem-user-s-keys-from-master-password-without-a-steemit-website-being-offline",
    ],
    ["phgnomo", "steem-project-of-the-week-1-get-on-steem"],
    ["perduta", "do-you-feel-connected-to-your-home-country"],
    ["jblew", "wise-jak-glosowac-za-cudze-vp-a-takze-czym-jest-wise-i-dlaczego-powstal-czesc-pierwsza-cyklu-o-wise"],
    ["steemprojects2", "4jxxyd-test"],
    ["jblew", "witajcie-steemianie-przybywam-jedrzej-lewandowski"],
    ["nicniezgrublem", "b52e6300-9011-11e8-b2de-f7be8f055a16"],
    ["steemprojects2", "sttnc-test"],
    ["artemistau", "wielcy-polacy-professor-zbigniew-religa"],
];

let posts: steem.SteemPost[] = [];
let accounts: steem.AccountInfo[] = [];
let dynamicGlobalProperties: steem.DynamicGlobalProperties | undefined = undefined;
let transactions: UnifiedSteemTransaction[] = [];
let blogEntries: steem.BlogEntry[] = [];

const defaultApiUrl = /*§ ' "' + data.config.steem.defaultApiUrl + '" ' §*/ "https://anyx.io" /*§ §.*/;
const api = new DirectBlockchainApi(Wise.constructDefaultProtocol(), "posting-wif-not-needed-", {
    url: defaultApiUrl,
});

BluebirdPromise.resolve()
    .then(() => console.log("Loading posts..."))
    .then(() => postLinks)
    .map((link_: any /* bluebird bug */) => {
        const link = link_ as [string, string];
        return api.loadPost(link[0], link[1]);
    })
    .then((values: steem.SteemPost[]) => {
        posts = values;
    })

    .then(() => console.log("Loading account infos..."))
    .then(() => usernames)
    .map((username: any /* bluebird bug */) => {
        return api.getAccountInfo(username);
    })
    .then((values: steem.AccountInfo[]) => {
        accounts = values;
    })

    .then(() => console.log("Loading dynamic global properties..."))
    .then(() => {
        return api.getDynamicGlobalProperties();
    })
    .then((value: steem.DynamicGlobalProperties) => {
        dynamicGlobalProperties = value;
    })

    .then(() => console.log("Loading transactions..."))
    .then(() => usernames) // for each username return a promise that returns transactions
    .mapSeries((username: any /* bluebird bug */) => {
        const trxs: UnifiedSteemTransaction[] = [];
        return BluebirdPromise.delay(2000)
            .then(() => {
                console.log("Loading transactions of @" + username + "...");

                return new SteemJsAccountHistorySupplier(new steem.api.Steem({ url: defaultApiUrl }), username)
                    .branch(historySupplier => {
                        historySupplier
                            .chain(new OperationNumberFilter(">", V1Handler.INTRODUCTION_OF_WISE_MOMENT).makeLimiter()) // this is limiter (restricts lookup to the period of wise presence)
                            .chain(
                                new SimpleTaker(
                                    (trx: UnifiedSteemTransaction): boolean => {
                                        trxs.push(trx);
                                        return true;
                                    }
                                )
                            )
                            .catch((error: Error) => false);
                    })
                    .start();
            })
            .then(() => {
                console.log("Done loading transactions of @" + username + "...");
                return trxs;
            });
    })
    .then((values: UnifiedSteemTransaction[][]) => {
        return values.reduce((allTrxs: UnifiedSteemTransaction[], nextTrxs: UnifiedSteemTransaction[]) =>
            allTrxs.concat(nextTrxs)
        );
    })
    .then((trxs: UnifiedSteemTransaction[]) => {
        transactions = trxs;
    })

    .then(() => console.log("Loading blog entries..."))
    .then(() => usernames)
    .map((username: any /* bluebird bug */) => {
        return api.getBlogEntries(username, 0, 500);
    })
    .then((values: steem.BlogEntry[][]) => {
        return values.reduce((allEntries: steem.BlogEntry[], nextEntries: steem.BlogEntry[]) =>
            allEntries.concat(nextEntries)
        );
    })
    .then((blogEntries_: steem.BlogEntry[]) => {
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
            blogEntries: blogEntries,
        };
        fs.writeFileSync(outFilePath, JSON.stringify(dataset));
    })
    .then(() => {
        console.log("Saved to " + outFilePath);
    })
    .catch((error: Error) => console.error(error));
