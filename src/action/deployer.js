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
        "name": ...
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
 * @param api_host The hostname where the OpenWhisk API is exposed. Default: localhost.
 * @param api_endpoint The Base URL used to invoke functions. You can use variables in the URL such as: git_org, git_repo, git_branch, package, action
 * @param manifest_file_location The folder where manifest.yaml is located. Default: ./
 * @returns {{payload: string}}
 */
function main(git_event,
              api_host = "localhost",
              api_endpoint = "https://localhost/api/v1/namespaces/guest/actions/{package}/{action}",
              manifest_file_location = "/") {
    //1. download the archive

    return new Promise(
        (resolve, reject) => {
            var git_client = new GitHubClient();

            if (git_event.repository === null || typeof(git_event.repository) === "undefined") {
                reject("Missing repository property from the event. Event details:" + util.inspect(git_event));
            }
            if (git_event.ref === null || typeof(git_event.ref) === "undefined") {
                console.log("Missing ref property from the event. Event details:" + util.inspect(git_event));
                git_event.ref = "master";
            }

            git_client.getArchive(git_event.repository, git_event.ref)
                .then((download_result) => {
                    let namespace = git_event.repository.full_name.replace("/", ".");
                    namespace += "." + git_event.ref.substr(git_event.ref.lastIndexOf("/") + 1);
                    let openwhisk_opts = {
                        apihost: git_event.api_host || api_host,
                        namespace: namespace
                    };
                    console.log("Initializing a new wskdeploy object with openwhisk_opts=" + util.inspect(openwhisk_opts));
                    var fn = new wskdeploy(
                        'manifest.yaml',
                        download_result.path + (git_event.manifest_file_location || manifest_file_location),
                        openwhisk_opts);

                    fn.deploy()
                        .then(
                            /**
                             * wskdeploy success handler
                             * @param deploy_result An object like
                             * {
                             *   manifest: this.manifest,
                             *   actions: actions_result
                             * }
                             * Where manifest is the loaded manifest
                             * actions : is an Array of actions deployed in OpenWhisk
                             */
                            (deploy_result) => {
                                console.log("deploy_result:" + util.inspect(deploy_result));
                                // TODO: remove the downloaded archive from the disk
                                console.log("TODO: Removing the archive from:" + download_result.path);
                                let branch_name = git_event.ref.substr(git_event.ref.lastIndexOf("/") + 1);
                                // TODO: provide links for all the actions in the package
                                //       this implementation assumes there's only 1 action in the package right now
                                if (deploy_result.actions === undefined) {
                                    console.error("Could not deploy the code.");
                                    reject({
                                        "message": "Could not deploy the code.",
                                        "details": deploy_result
                                    });
                                }
                                let rest_endpoint = git_event.api_endpoint || api_endpoint;
                                resolve({
                                    "action_endpoint": rest_endpoint
                                        .replace("{git_repo}", git_event.repository.name)
                                        .replace("{git_org}", git_event.repository.owner.name)
                                        .replace("{git_branch}", branch_name)
                                        .replace("{package}", deploy_result.manifest.package.name)
                                        .replace("{action}", deploy_result.actions[0].name)
                                });
                            })
                        .catch((deploy_error) => {
                            console.error("deploy_error:" + util.inspect(deploy_error));
                            reject({
                                "message": "deploy_error",
                                "details": util.inspect(deploy_error)
                            });
                        });
                }).catch((download_error) => {
                reject(download_error);
            });
        }
    )

}

export default main;