
var path = require('path');

process.env.NODE_RED_HOME = process.env.NODE_RED_HOME || path.resolve(__dirname+"/../../node-red");
//console.log("HOME",process.env.NODE_RED_HOME);
var helper = require(path.join(process.env.NODE_RED_HOME, 'test', 'nodes', 'helper.js'));

try {
    helper.nock = helper.nock || require("nock");
} catch(er) {
    helper.nock = null;
}
module.exports = helper;
