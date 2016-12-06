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

/**
 * @param params The GitHub event
 * @returns {{payload: string}}
 */
function main(params) {
    //1. download the archive
    var git_client = new GitHubClient();

    var name = params.name || "World";
    return {payload: "Hello, " + name + "!"};
}

export default main;