var fs = require("fs");
var smartvotesLib = require("../../dist/steem-smartvotes.js");
/**
 * Note that smartvotesLib is a module namespace. To access main class use *steemsmartvotes.SteemSmartvotes*.
 * #validateJson() is a static method of the class.
 */

/**
 * To run this example:
 * node send-rulesets.js /path/to/credentials.file.json
 *
 * Credentials file format: {"username": "", "postingWif": ""}.
 */
loadCredentials(function(credentials) {
    sendRulesets(credentials)
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

function sendRulesets(credentials) {
    var ruleset1 = {
        name: "Curator of tag #smartvotes",
        voter: "steemprojects1",
        total_weight: 20000,
        action: "upvote+flag",
        rules: [
            {
                type: "tags",
                mode: "allow",
                tags: ["smartvotes"]
            }
        ]
    };

    var ruleset2 = {
        name: "Punish bad content by @nonexistentuser1 and @nonexistentuser2 on tags #tag1 and #tag2.",
        voter: "steemprojects1",
        total_weight: 20000,
        action: "flag",
        rules: [
            {
                type: "tags",
                mode: "allow",
                tags: ["tag1", "tag2"]
            },
            {
                type: "authors",
                mode: "allow",
                authors: ["nonexistentuser1", "nonexistentuser2"]
            }
        ]
    };

    var smartvotes = new smartvotesLib.SteemSmartvotes(credentials.username, credentials.postingWif);
    smartvotes.sendRulesets([ruleset1, ruleset2], function(error) {
        if(error) {
            console.error(error);
            return;
        }
        console.log("Rulesets sent. You can see them on: https://steemd.com/@"+credentials.username);
    });
}

