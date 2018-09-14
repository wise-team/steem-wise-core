/**
 * WARNING! This example is outdated. We are working on making it up-to-date.
 * TODO update this example
 */

var steemsmartvotes = require("../../dist/steem-smartvotes.js");
/**
 * Note that steemsmartvotes is a module namespace. To access main class use *steemsmartvotes.SteemSmartvotes*.
 * #validateJson() is a static method of the class.
 */

var json1 = {
    "name": "set_rules",
    "rulesets": []
};//should be valid

var json2 = {
    "name": "send_voteorder",
    "voteorder": {
        
    }
};//should be invalid

var json3 = {
    "name": "unknown_command"
};//should be invalid

var result1 = steemsmartvotes.SteemSmartvotes.validateJSON(JSON.stringify(json1));
console.log("json1.isValid="+result1+". This is "+(result1 == true? "correct" : "incorrect")+".");

var result2 = steemsmartvotes.SteemSmartvotes.validateJSON(JSON.stringify(json2));
console.log("json2.isValid="+result2+". This is "+(result2 == false? "correct" : "incorrect")+".");

var result3 = steemsmartvotes.SteemSmartvotes.validateJSON(JSON.stringify(json3));
console.log("json3.isValid="+result3+". This is "+(result3 == false? "correct" : "incorrect")+".");
