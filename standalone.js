/**
 * Invokes the compiled function in standalone mode.
 *
 * To run it: node standalone.js
 *
 * NOTE: run  `npm install` before running this.
 */
var vm = require('vm');
var fs = require('fs');
var util = require('util');


var filename = './whisk-github-deployer-0.0.1.js';

var sandbox = {
    require: require,
    process: process,
    Buffer: Buffer,
    console: console,
    setImmediate: setImmediate,
    global: global
};
console.log("Loading:" + filename);
var script = new vm.Script(fs.readFileSync(filename, 'utf-8'));
var context = new vm.createContext(sandbox);
script.runInContext(context);

this.userScriptMain = sandbox.main;
if (typeof this.userScriptMain === 'function') {
    this.userScriptMain({})
        .then( function (result) {
            console.log("RESULT:");
            console.log(result);
        }).catch( function (error) {
            console.error(error);
        });


} else {
    console.log(typeof this.userScriptMain);
}