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
import GitHubClient from './github/github-client';
import wskdeploy from '../../src/action/wskdeploy/wskdeploy';

/**
 * @param params The GitHub event
 * @returns {{payload: string}}
 */
function main(params) {
    //1. download the archive

    return new Promise(
        (resolve, reject) => {
            var git_client = new GitHubClient();

            // TODO: read params from the source event
            var params = {
                "repository": {
                    "name": "openwhisk-github-deployer",
                    "full_name": "ddragosd/openwhisk-github-deployer",
                    "archive_url": "https://api.github.com/repos/ddragosd/openwhisk-github-deployer/{archive_format}{/ref}",
                }
            };

            git_client.getArchive(params.repository)
                .then((download_result) => {
                    var fn = new wskdeploy('manifest.yaml', download_result.path, {
                        namespace: params.repository.full_name.replace("/", "_")
                    });
                    fn.deploy().then((deploy_result) => {
                        resolve(deploy_result);
                    }).catch((deploy_error) => reject(deploy_error));
                }).catch((download_error) => {
                reject(download_error);
            });
        }
    )

}

export default main;