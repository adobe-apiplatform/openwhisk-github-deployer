/**
 * Class used as a client for GitHub, implementing the operations needed by this action
 */
import fs from 'fs';
import fspath from 'path';
import https from 'https';
import url from 'url';
import util from 'util';
import request from 'request';
import unzip from 'unzip';

/**
 * A client for GitHub to download a ZIP archive, unzip it and return the root folder of the archive.
 */
export default class GitHubClient {
    constructor() {

    }

    /**
     * Downloads an archive from the given repository and saves it in the specified output location.
     * API Ref: https://developer.github.com/v3/repos/contents/
     *
     * @param repository The repository object that should contain the archive_url, name properties
     * @param ref The ref to download. Default: /master
     * @param fmt The archive format : zipball or tarball. Default: zipball
     * @param output The folder on the local disk where to save the archive
     */
    getArchive(repository, ref = "master", fmt = "zipball", output = "./") {
        return new Promise(
            (resolve, reject) => {

                var req_options = {
                    url: repository.archive_url.replace("{archive_format}", fmt).replace("{/ref}", "/" + ref),
                    headers: {
                        'User-Agent': 'openwhisk-github-deployer',
                        'Accept': '*/*'
                    }
                };
                var output_path = fs.mkdtempSync(output + "/" + repository.name + "-");
                // var output_path = output + "/" + repository.name + "/" + new Date().toISOString();
                var tmp_archive_file = output_path + "/" + repository.name + ".zip";

                // invoke the request
                console.info("Downloading archive from: " + util.inspect(req_options) + ", into: " + output_path);


                var file = fs.createWriteStream(tmp_archive_file)
                    .on('open', () => {
                        var r = request(req_options)
                            .on('error', (error) => { /* conn refused, timeout, etc */
                                console.error("Error downloading archive from:" + req_options.url);
                                console.error(error);
                                fs.unlink(tmp_archive_file);
                                reject({result: false, error: error})
                            });
                        r.on('complete', (resp, resp_body) => {
                            console.log("GitHub request: complete() handler with statusCode=" + resp.statusCode);
                            if (resp.statusCode !== 200) {
                                console.error("Error downloading archive from:" + req_options.url + " code=" + resp.statusCode);
                                reject({
                                    result: false,
                                    error: {
                                        message: "Error downloading archive from: " + req_options.url,
                                        response_code: resp.statusCode,
                                        response_body: resp_body
                                    }
                                });
                            }
                        });
                        r.on('response', (resp) => {
                            console.log("GitHub request: response() handler with statusCode=" + resp.statusCode);
                            if (resp.statusCode == 200) {
                                r.pipe(file);
                            }
                        });
                    })
                    .on('finish', () => {
                        console.log("Saved archive in :" + tmp_archive_file);
                        fs.createReadStream(tmp_archive_file)
                            .pipe(unzip.Extract({path: output_path}))
                            .on('close', () => {
                                console.info("Unzip completed ...");
                                this._getArchiveRootFolder(repository, output_path)
                                    .then((root) => {
                                        resolve({result: true, path: root});
                                    })
                                    .catch((err) => {
                                        reject({result: false, error: err});
                                    });
                            })
                    });
            }
        )
    }

    /**
     * Returns the root folder for this archive
     * @param repository The repository object that should contain the archive_url, name properties
     * @param p Output path where the archive has been unzipped
     * @returns {Promise} Promise object
     * @private
     */
    _getArchiveRootFolder(repository, p = './') {
        return new Promise(
            (resolve, reject) => {
                fs.readdir(p, function (err, files) {
                    if (err) {
                        return reject(err);
                    }

                    var folders = files.map((file) => {
                        return fspath.join(p, file);
                    }).filter((file) => {
                        return fs.statSync(file).isDirectory() &&
                            file.indexOf(repository.name) >= 0;
                    });

                    resolve(folders[0]);
                });
            });
    }
}