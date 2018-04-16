var fs = require("fs");
var smartvotesLib = require("../../dist/lib/steem-smartvotes.js");
/**
 * Note that smartvotesLib is a module namespace. To access main class use *steemsmartvotes.SteemSmartvotes*.
 * #validateJson() is a static method of the class.
 */

loadCredentials(function(credentials) {
    sendVote(credentials)
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

function sendVote(credentials) {
    var vote = {
        author: "steemit",
        permalink: "firstpost",
        delegator: "steemprojects1",
        weight: 10000,
        type: "vote"
    };

    var smartvotes = new smartvotesLib.SteemSmartvotes(credentials.username, credentials.postingWif);
    smartvotes.sendVoteOrder(vote, function(error) {
        if(error) {
            console.error(error);
            return;
        }
        console.log("Vote sent. You can see it on: https://steemd.com/@"+credentials.username);
    });
}
