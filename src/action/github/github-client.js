/**
 * Class used as a client for GitHub, implementing the operations needed by this action
 */
import fs from 'fs';
import https from 'https';
import url from 'url';
import util from 'util';
import request from 'request';
import unzip from 'unzip';

export default class GitHubClient {
    constructor() {

    }

    /**
     * Downloads an archive from the given repository and saves it in the specified output location.
     * API Ref: https://developer.github.com/v3/repos/contents/
     *
     * @param repository The repository object that should contains the archive_url, name properties
     * @param ref The ref to download. Default: /master
     * @param fmt The archive format : zipball or tarball. Default: zipball
     * @param output The folder on the local disk where to save the archive
     */
    getArchive(repository, ref = "/master", fmt = "zipball", output = "./") {
        return new Promise(
            (resolve, reject) => {

                var req_options = {
                    url: repository.archive_url.replace("{archive_format}", fmt).replace("{/ref}", ref),
                    headers: {
                        'User-Agent': 'openwhisk-github-deployer',
                        'Accept': '*/*'
                    }
                };

                var output_path = output + "/" + repository.name;

                // invoke the request
                console.info("Downloading archive from: " + util.inspect(req_options) + ", into: " + output_path);

                var r = request(req_options)
                    .on('error', (error) => { /* conn refused, timeout, etc */
                        console.error("Error downloading archive from:" + req_options.url);
                        console.error(error);
                        reject({result: false, error: error})
                    });
                r.on('response', (resp) => {
                    if (resp.statusCode == 200) {
                        r.pipe(unzip.Extract({path: output_path}));
                        return resolve({result: true, path: output_path});
                    }
                    console.error("Error downloading archive from:" + req_options.url + " code=" + resp.statusCode);
                    // r.pipe(console.error);
                    reject({result: false});
                });
            }
        )
    }
}