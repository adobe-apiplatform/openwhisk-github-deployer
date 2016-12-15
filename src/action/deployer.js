/**
 * This function listens to a GitHub PUSH event in order to
 * create/update an OpenWhisk function on each push.
 *
 * More Info: https://developer.github.com/v3/activity/events/types/#pushevent
 *
 * The Event name is sent as a header. I.e. X-GitHub-Event: push
 * More Info: https://developer.github.com/webhooks/#events
 *
 * Sample payload:
 * {
  "ref": "req-val-upgrade",
  "ref_type": "branch",
  "pusher_type": "user",
  "repository": {
    "id": 40624779,
    "name": "apigateway",
    "full_name": "adobe-apiplatform/apigateway",
    "owner": {
     ...
    },
    "private": false,
    "fork": false,
    "url": "https://api.github.com/repos/adobe-apiplatform/apigateway",
    "archive_url": "https://api.github.com/repos/adobe-apiplatform/apigateway/{archive_format}{/ref}",
    "downloads_url": "https://api.github.com/repos/adobe-apiplatform/apigateway/downloads",
  },
  "organization": {
    "login": "adobe-apiplatform",
    "url": "https://api.github.com/orgs/adobe-apiplatform",
  },
  "sender": {
    "login": "ddragosd",
    "type": "User"
  }
} **/
import util from 'util';
import GitHubClient from './github/github-client';
import wskdeploy from '../../src/action/wskdeploy/wskdeploy';

/**
 * @param git_event The GitHub event.
 * @param manifest_file_location The folder where manifest.yaml is located. Default: ./
 * @returns {{payload: string}}
 */
function main(git_event, manifest_file_location = "/") {
    //1. download the archive

    return new Promise(
        (resolve, reject) => {
            var git_client = new GitHubClient();

            if (git_event.repository === null || typeof(git_event.repository) === "undefined") {
                reject("Missing repository property from the event. Event details:" + util.inspect(git_event));
            }
            if (git_event.ref === null || typeof(git_event.ref) === "undefined") {
                console.log("Missing ref property from the event. Event details:" + util.inspect(git_event));
                git_event.ref = "/master";
            }

            git_client.getArchive(git_event.repository, git_event.ref)
                .then((download_result) => {
                    let namespace = git_event.repository.full_name.replace("/", ".");
                    namespace += "." + git_event.ref.substr(git_event.ref.lastIndexOf("/") + 1);
                    var fn = new wskdeploy('manifest.yaml', download_result.path + manifest_file_location, {
                        namespace: namespace
                    });
                    fn.deploy().then((deploy_result) => {
                        // TODO: remove the downloaded archive from the disk
                        console.log("TODO: Removing the archive from:" + download_result.path);

                        resolve(deploy_result);
                    }).catch((deploy_error) => reject(deploy_error));
                }).catch((download_error) => {
                reject(download_error);
            });
        }
    )

}

export default main;