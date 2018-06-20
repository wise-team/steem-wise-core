/*****************************
 * SEND VOTEORDER in ts-node *
 *****************************/
import { Wise, DirectBlockchainApi, SteemOperationNumber, SendVoteorder } from "../../src/wise";

const voter: string = "steemprojects1";
const postingKeyWif: string = "...";
// "Error: Non-base58 character" means that postingKeyWif is malformated or you forgot to paste it here.

const delegator: string = "steemprojects3";
const voteorder: SendVoteorder = {
    rulesetName: "Vote WISEly",
    author: "noisy",
    permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
    weight: 20
};

const api = new DirectBlockchainApi(voter, postingKeyWif);
const wise = new Wise(voter, api);

wise.sendVoteorderAsync(delegator, voteorder)
    .then((result: SteemOperationNumber) => {
        console.log("Voteorder sent. You can see it on: https://steemd.com/@" + voter
                + ", or on: https://steemd.com/b/" + result.blockNum);
    })
    .catch((error: Error) => {
        console.error(error);
    });

// you can run the example using "$ ts-node send-voteorder.ts"