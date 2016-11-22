"use strict";

import fs from 'fs';
import vm from 'vm';
import util from 'util';

/**
 * Stub class used to test Whisk Actions
 */
export default class WhiskInvokerStub {
    /**
     *
     * @param path The path to the script file
     * @param mainMethod The name of the mainMethod (default:main)
     */
    constructor(path, mainMethod) {
        this.path = path;
        this.mainMethod = mainMethod || "main";
        console.info("WhiskInvokerStub initialized with path:" + this.path + ", mainMethod:" + this.mainMethod)
    }

    /**
     * Initializes the function by loading the code into a sandbox context and saving the main function code
     * @param message
     * @returns {Promise}
     */
    init(message) {
        console.info("Loading user code. Action entrypoint is:" + message.main);
        // Loading the user code.
        return new Promise(
            (resolve, reject) => {
                try {
                    var sandbox = {};
                    var script = new vm.Script(message.code);
                    var context = new vm.createContext(sandbox);
                    script.runInContext(context);
                    console.log("User code loaded. Result:" + util.inspect(sandbox));

                    this.userScriptMain = sandbox.main;

                    if (typeof this.userScriptMain === 'function') {
                        // The value 'true' has no special meaning here;
                        // the successful state is fully reflected in the
                        // successful resolution of the promise.
                        resolve(true);
                    } else {
                        throw "Action entrypoint '" + message.main + "' is not a function.";
                    }
                } catch (e) {
                    reject(e);
                }
            }
        )
    }

    /**
     * Loads the code from the file system, calling the init method on success.
     * @returns {Promise}
     */
    load() {
        return new Promise(
            (resolve, reject) => {
                if (this.script !== null && typeof(this.script) !== "undefined") {
                    // the script has been already loaded
                    resolve(true)
                }

                fs.readFile(__dirname + "/" + this.path,
                    (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        this.init({
                            "main": this.mainMethod,
                            "code": data.toString()
                        }).then(
                            result => resolve(true))
                            .catch(
                                err => reject(err)
                            )
                    })
            }
        )
    }

    /**
     * Executes the function.
     * @param params Function parameters
     * @returns {Promise}
     */
    run(params) {
        var result = undefined;
        return new Promise(
            (resolve, reject) => {
                try {
                    result = this.userScriptMain(params);
                } catch (e) {
                    reject(e);
                }

                // Non-promises/undefined instantly resolve.
                Promise.resolve(result)
                    .then(
                        resolvedResult => {
                            console.log("Execution result is:" + util.inspect(result));
                            // This happens, e.g. if you just have "return;"
                            if (typeof resolvedResult === "undefined") {
                                resolvedResult = {};
                            }
                            resolve(resolvedResult);
                        })
                    .catch(
                        error => {
                            console.error("Error details:" + util.inspect(error));
                            // A rejected Promise from the user code maps into a
                            // successful promise wrapping a whisk-encoded error.
                            resolve({error: error});
                        });
            }
        )
    }
}

