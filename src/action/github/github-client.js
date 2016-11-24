/**
 * Class used as a client for GitHub, implementing the operations needed by this action
 */
import fs from 'fs';
import https from 'https';
import url from 'url';
import util from 'util';
import request from 'request';

export default class GitHubClient {
    constructor() {

    }

    /**
     * Downloads an archive from th given repository and saves it in the specificed output location.
     * API Ref: https://developer.github.com/v3/repos/contents/
     *
     * @param repository The repository object that should contains the archive_url property
     * @param ref The ref to download
     * @param fmt The archive format. Default: zipball or tarball
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

                var tmp_file = output + "/" + repository.name + ".zip";

                // invoke the request
                console.info("Downloading archive from: " + util.inspect(req_options) + ", into: " + tmp_file);

                request(req_options)
                    .on('error', (error) => {
                        console.error(error);
                        fs.unlink(tmp_file);
                        reject(error);
                    })
                    .pipe(fs.createWriteStream(tmp_file));

                //npm install adm-zip
                /*var zip = new AdmZip(tmpFilePath)
                 zip.extractAllTo("assets/extracted/" + filename)
                 fs.unlink(tmpFilePath)*/
                // resolve(tmp_file);
            }
        )
    }
}