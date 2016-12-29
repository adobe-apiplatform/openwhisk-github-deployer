/**
 * Reads the manifest.yaml from the root of the repository and deploys the package to Openwhisk
 */
import fs from 'fs';
import yaml from 'js-yaml';
import util from 'util';
import openwhisk from 'openwhisk';

/*
 * The path to the file containing the manifest
 */
const DEFAULT_MAINFEST = "manifest.yaml";
const DEFAULT_NAMESPACE = "guest";
const DEFAULT_OPENWHISK_PROPS = {
    "apihost": "localhost",
    "namespace": DEFAULT_NAMESPACE,
    "api_key": "23bc46b1-71f6-4ed5-8c54-816aa4f8c502:123zO3xZCLrMN6v2BKK1dXYFpXlPkccOFqm12CdAsMgRU4VrNZ9lyGVCGuMDGIwP",
    "ignore_certs": true
};

export default class WskDeploy {
    /**
     * @param manifest The path to the Manifest YAML file
     * @param root The base path where the manifest is
     * @param openwhisk_props An object with "namespace", "apihost", and "auth" props used by Openwhisk client
     */
    constructor(manifest = DEFAULT_MAINFEST, root = './', openwhisk_props = DEFAULT_OPENWHISK_PROPS) {
        this.manifest_file = manifest;
        this.root_folder = root;

        // Until OpenWhisk provides an API to create namespaces we need to prefix the package name with
        // the namespace. i.e. "myNamespace_myPackage".
        this.namespace = openwhisk_props.namespace;

        // merge DEFAULT props with openwhisk_props
        let ow_props = Object.assign({}, DEFAULT_OPENWHISK_PROPS, openwhisk_props);
        ow_props.namespace = DEFAULT_NAMESPACE;

        console.log("Initializing a new OpenWhisk client with :" + util.inspect(ow_props));
        this.openwhisk_client = openwhisk(ow_props);
        this.openwhisk_client_props = ow_props;
    }

    _loadManifest() {
        return new Promise(
            (resolve, reject) => {
                var file_path = this.root_folder + "/" + this.manifest_file;
                console.info("Loading function manifest from:" + file_path);
                var doc = yaml.safeLoad(fs.readFileSync(file_path, 'utf-8'));
                console.log("Loaded manifest data:" + util.inspect(doc, {depth: 5}));
                resolve(doc);
            }
        )

    }

    /**
     * Create or update a package
     * @param pckg The info about the package
     * @returns {Promise.<T>}
     * @private
     */
    _deployPackage(pckg) {
        return new Promise(
            (resolve, reject) => {
                this.openwhisk_client.packages.get(pckg)
                    .then((package_result) => {
                        console.log("updating package:" + pckg.packageName);
                        // resolve(this.openwhisk_client.packages.update(pckg));
                        // ignore for now if the package exists already
                        resolve({"result": "package exists"});

                    })
                    .catch((package_error) => {
                        console.log("creating package:" + pckg.packageName);
                        resolve(this.openwhisk_client.packages.create(pckg));
                    });
            })
    }

    /**
     * Deploy actions in OpenWhisk.
     * @param actions One or more actions as read from the manifest
     * @returns {Promise.<T>}
     * @private
     */
    _deployActions(actions) {
        let action_list = Array.isArray(actions) ? actions : [actions];
        let action_chain = [];
        action_list.forEach((action) => {
            action_chain.push(this._deployAction(action));
        });
        return Promise.all(action_chain);
    }

    /**
     * Deploys a single action to OpenWhisk
     * @param action An Object like
     *      hello:
     *          version: 1.0
     *          location: src/greeting.js
     *          runtime: nodejs@6
     * @private
     */
    _deployAction(action) {
        return new Promise(
            (resolve, reject) => {
                let action_name = Object.keys(action)[0];
                let action_info = action[action_name];
                if (action_info === null || typeof(action_info) === "undefined") {
                    reject("Action " + action_name + "is undefined. Action object:" + util.inspect(action));
                    return;
                }
                console.log("Adding/updating action: " + action_name + ". Details:" + util.inspect(action_info));
                let action_src_path = this.root_folder + "/" + action_info.location;
                if (action_info.location === null || typeof(action_info.location) === "undefined") {
                    reject("Action " + action_name + " is missing the location property. Action details:" + util.inspect(action_info));
                    return;
                }
                console.log("Reading action src from " + action_src_path);

                let action_src = fs.readFileSync(action_src_path, 'utf-8');

                let action_qualified_name = this.manifest.package.openwhisk_name + "/" + action_name;

                console.info("Deploying action: " + action_qualified_name + " from :" + action_src_path);
                // NOTE: openwhisk client only supports nodejs6 "kind" of actions ATM
                let action_opts = {
                    actionName: action_qualified_name,
                    action: action_src,
                    namespace: this.openwhisk_client_props.namespace
                };
                this.openwhisk_client.actions.update(action_opts)
                    .then((update_result) => {
                        resolve(update_result);
                    })
                    .catch((update_error) => {
                        console.warn("There was an error updating the action:" + action_opts.actionName + ". Recreating it.");
                        console.log("update_error:" + util.inspect(update_error));
                        // try to delete and re-create the action
                        this.openwhisk_client.actions.delete(action_opts)
                            .then((delete_result) => {
                                this.openwhisk_client.actions.create(action_opts)
                                    .then((recreate_result) => {
                                        console.log("Recreated action:" + action_opts.actionName + ". Result:" + util.inspect(recreate_result));
                                        resolve(recreate_result);
                                    })
                                    .catch((recreate_error) => {
                                        console.warn("Could not delete/create the action:" + action_opts.actionName);
                                        reject({
                                            "message": "Could not recreate action:" + action_opts.actionName,
                                            "details": util.inspect(recreate_error)
                                        });
                                    });

                            })
                            .catch((get_error) => {
                                console.error("Could not retrieve action " + action_opts.actionName);
                                reject({
                                    "message": "Error recreating the action:" + action_opts.actionName,
                                    "details": util.inspect(get_error)
                                })
                            })
                    })
            }
        );
    }

    /**
     * Deploy the Whisk package based on the manifest
     * @returns {Promise}
     */
    deploy() {
        return new Promise(
            (resolve, reject) => {
                this._loadManifest()
                    .then(
                        (manifest) => {
                            // TODO: validate that the manifest has the required fields
                            // save manifest data
                            this.manifest = manifest;
                            this.manifest.package.openwhisk_name = this.namespace + "_" + manifest.package.name;
                            return this._deployPackage({packageName: this.manifest.package.openwhisk_name});
                        })
                    .then(
                        (package_result) => {
                            console.log("Deploy Package result: ");
                            console.log(package_result);
                            //package_result.name
                            return this._deployActions(this.manifest.package.actions);
                        }, (package_error) => {
                            console.warn("Error updating the package:");
                            console.warn(package_error);
                            reject(package_error);
                        })
                    .then(
                        /**
                         * _deployActions resolve handler
                         * @param actions_result An array with responses from OpenWhisk, one response per action
                         */
                        (actions_result) => {
                            console.log("Deploy actions result:" + util.inspect(actions_result));
                            resolve({
                                manifest: this.manifest,
                                actions: actions_result
                            });
                        }, (actions_error) => {
                            console.warn("Could not deploy actions.");
                            console.warn(actions_error);
                            reject(actions_error);
                        }
                    )
                    .catch((error) => {
                        console.error("Error deploying the package:" + util.inspect(error));
                        reject(error);
                    });
            }
        )

    }

}