/**
 * WARNING! This example is outdated. We are working on making it up-to-date.
 * TODO update this example
 */

/**
 * In this example we can validate certain articles against rules set by guest123.
 */

var fs = require("fs");
var smartvotesLib = require("../../dist/steem-smartvotes.js");
/**
 * Note that smartvotesLib is a module namespace. To access main class use *steemsmartvotes.SteemSmartvotes*.
 * #validateJson() is a static method of the class.
 */

/**
 * To run this example:
 * node rules-validation.js
 */

var voteorder1_wrong_tag = {
    ruleset_name: "Curator of tag #smartvotes",
    author: "steemit",
    permlink: "firstpost",
    delegator: "steemprojects1",
    weight: 10,
    type: "upvote"
};

var smartvotes = new smartvotesLib.SteemSmartvotes("guest123, ", "5JRaypasxMx1L97ZUX7YuC5Psb5EAbF821kkAGtBj7xCJFQcbLg");

// TODO check if SteemOperationNumber.FUTURE works here
smartvotes.validateVoteOrder("steemprojects1", voteorder1_wrong_tag, function(error, isValid) {
    console.log("Vote order is [ " + (isValid? "valid" : "invalid") + " ].");
    if (error) {
        console.error(error);
    }
});
