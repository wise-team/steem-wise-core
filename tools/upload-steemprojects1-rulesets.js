var fs = require("fs");
var smartvotesLib = require("../dist/steem-smartvotes.js");
var steemprojects1Rulesets = require("../test/data/steemprojects1-rulesets.js");

/**
 * To run this script:
 * node upload-steemprojects1-rulesets.js /path/to/credentials.file.json
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
    var smartvotes = new smartvotesLib.SteemSmartvotes(credentials.username, credentials.postingWif,
        { url: "https://gtg.steem.house:8090", uri: "https://gtg.steem.house:8090" });
    smartvotes.sendRulesets(steemprojects1Rulesets.rulesets, function(error) {
        if(error) {
            console.error(error);
            return;
        }
        console.log("Rulesets sent. You can see them on: https://steemd.com/@"+credentials.username);
    });
}

