import {smartvotes_vote_weight} from "../../schema/votes.schema";

var smartvotesLib = require("../../dist/lib/steem-smartvotes.js");
var fs = require('fs');

/**
 * Note that smartvotesLib is a module namespace. To access main class use *steemsmartvotes.SteemSmartvotes*.
 * #validateJson() is a static method of the class.
 */

var credentials = {username: "", keyWif: ""};

/* credentials file should be a JSON file with the same structure as the credentials var. */
if(process.argv.length > 2) {
    var credentialsFilePath = process.argv[2];
    fs.readFile(credentialsFilePath, function (error, content) {
        if (error) console.err("Could not load credentials file: "+error.message);
        else credentials = JSON.parse(content);
    });
}

var vote = {
    author: "steemit",
    permalink: "firstpost",
    delegator: "steemprojects1",
    weight: 10000,
    type: "vote"
};

var smartvotes = new smartvotesLib.SteemSmartvotes(credentials.username, credentials.keyWif);
smartvotes.sendVote(vote, function(success, error) {
    if(success)
});