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
const DEFAULT_OPENWHISK_PROPS = {
    "apihost": "localhost",
    "namespace": "guest",
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

        console.log("Initializing a new OpenWhisk client with :" + util.inspect(ow_props));
        this.openwhisk_client = openwhisk(ow_props);
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
     *
     * @param pckg The info about the package
     * @private
     */
    _deployPackage(pckg) {
        return new Promise(
            (resolve, reject) => {
                this.openwhisk_client.packages.get(pckg)
                    .then((package_result) => {
                        console.log("updating package:" + pckg.packageName);
                        resolve(this.openwhisk_client.packages.update(pckg));
                        // .then( (package_result) => { resolve(package_result); })
                        // .catch( (package_error) => { reject(package_error); });
                    })
                    .catch((package_error) => {
                        console.log("creating package:" + pckg.packageName);
                        resolve(this.openwhisk_client.packages.create(pckg));
                    });
            })

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
                            var package_name = this.namespace + "_" + manifest.package.name;
                            return this._deployPackage({packageName: package_name});
                        })
                    .then(
                        (package_result) => {
                            console.log("Deploy Package result: ");
                            console.log(package_result);
                            resolve(package_result.name);
                        }, (package_error) => {
                            console.log("Error deploying the package:");
                            console.log(package_error);
                            reject(package_error);
                        })
                    // for every action in actions
                    // this._deployAction(action)
                    // .then().catch()
                    .catch((error) => {
                        reject(error);
                    });
            }
        )

    }

}