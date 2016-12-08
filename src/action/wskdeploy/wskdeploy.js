/**
 * Reads the manifest.yaml from the root of the repository and deploys the action to Openwhisk
 */
import fs from 'fs';
import yaml from 'js-yaml';
import util from 'util';

/*
 * The path to the file containing the manifest
 */
const DEFAULT_MAINFEST = "manifest.yaml";

export default class WskDeploy {
    /**
     * @param manifest The path to the Manifest YAML file
     * @param root The base path where the manifest is
     */
    constructor(manifest = DEFAULT_MAINFEST, root = './') {
        this.manifest_file = manifest;
        this.root_folder = root;
    }

    _loadManifest() {
        return new Promise(
            (resolve, reject) => {
                var file_path = this.root_folder + "/" + this.manifest_file;
                console.info("Loading function manifest from:" + file_path);
                var doc = yaml.safeLoad(fs.readFileSync(file_path, 'utf-8'));
                console.warn(util.inspect(doc,{depth:5}));
                resolve(doc);
            }
        )

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

    deploy() {
        this._loadManifest()
            .then((manifest) => {
                console.warn(manifest);
                // for every action in actions
                    // this._deployAction(action)
                        // .then().catch()
            }).catch((error) => {

        });
    }

}