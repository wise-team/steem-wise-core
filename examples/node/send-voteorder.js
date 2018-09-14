/**
 * WARNING! This example is outdated. We are working on making it up-to-date.
 * TODO update this example
 */


var fs = require("fs");
var wiseLib = require("../../dist/wise.js");
/**
 * Note that wiseLib is a module namespace. To access main class use *wise.Wise*.
 */

/**
 * To run this example:
 * node send-vote.js /path/to/credentials.file.json
 *
 * Credentials file format: {"username": "", "postingWif": ""}.
 */
loadCredentials(function(credentials) {
    sendVoteorder(credentials)
});

function loadCredentials(callback) {
    var credentials = {username: "", postingWif: ""}
    /* credentials file should be a JSON file with the same structure as the credentials var. */
    if (process.argv.length > 2) {
        var credentialsFilePath = process.argv[2];
            fs.readFile(credentialsFilePath, function (error, content) {
                if (error) console.err("Could not load credentials file: " + error.message);
                else {
                    credentials = JSON.parse(content);
                    console.log("Using credentials from " + credentialsFilePath);
                }
                callback(credentials);
        });
    }
    else callback(credentials);
}

function sendVoteorder(credentials) {
    const delegator = "steemprojects3"
    const voteorder = {
        rulesetName: "Vote WISEly",
        author: "noisy",
        permlink: "what-we-can-say-about-steem-users-based-on-traffic-generated-to-steemprojects-com-after-being-3-days-on-top-of-trending-page",
        weight: 20
    };

    const api = new wiseLib.DirectBlockchainApi(credentials.postingWif);
    const wise = new wiseLib.Wise(credentials.username, api);
    wise.sendVoteorder(delegator, voteorder, function(error, result) {
        if(error) {
            console.error(error);
            return;
        }
        console.log("Voteorder sent. You can see it on: https://steemd.com/@"+credentials.username+", or on: https://steemd.com/b/" + result.blockNum);
    });
}
