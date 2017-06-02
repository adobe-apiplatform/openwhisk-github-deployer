OpenWhisk GitHub Deployer
==========================

[![CircleCI](https://circleci.com/gh/adobe-apiplatform/openwhisk-github-deployer.svg?style=svg)](https://circleci.com/gh/adobe-apiplatform/openwhisk-github-deployer)
[![codecov](https://codecov.io/gh/adobe-apiplatform/openwhisk-github-deployer/branch/master/graph/badge.svg)](https://codecov.io/gh/adobe-apiplatform/openwhisk-github-deployer)

Serverless function that can automatically create/update OpenWhisk actions on each git-push based on a [manifest.yaml](test/resources/hello-world-function/manifest.yaml) file.

The goal is to deploy actions in OpenWhisk without having to use a CLI.
  
The code for the function is found in [src/action/deployer.js](src/action/deployer.js).  


### Getting Started

#### Compile the action
```bash
# Install dependencies and compile the action.
> npm install

# Test it
> npm test

```

The action is compiled in the root folder as `whisk-github-deployer-<version>.js`.

#### Deploy the github-deployer action in OpenWhisk

```bash
# add wsk CLI to the path
export PATH=$PATH:/path/to/openwhisk/bin
wsk -i action create github-deployer ./whisk-github-deployer-0.0.1.js  \ 
        --param api_host my.openwhisk.example.com \
        --param api_endpoint https://my.openwhisk.example.com/api/v1/namespaces/guest/actions/{package}/{action}
```

* `api_host` parameter specifies the hostname exposing the API for OpenWhisk 
* `api_endpoint` parameter specifies the REST endpoint template that can be used to invoke action. This endpoint can be customized via the built-in variables:
  * `git_repo` - the name of the repository in git
  * `git_org` - the name of the organization in git
  * `git_branch` - the name of the branch
  * `manifest_package` - the name of the package as defined in the `manifest.yaml` file.
  * `package` - the name of the OpenWhisk package. It's currently derived from the details of the repository and the `manifest.yaml` file: `${git_org}.${git_repo}.${git_branch}_${manifest_package}`
  * `action` - the name of the OpenWhisk action

For example a nice way to expose actions hosted in GitHub is to expose them from a URI as the one bellow:
 `https://my.openwhisk.example.com/github.com/<git_org>/<git_repo>/<git_branch>/<package>/<action>`
 
Such URI ensures there's no risk of path collision between multiple orgs and repos in Git. 
At the same time because the `git_branch` is in the URL it allows developers to test multiple versions of the same function independently. 

 This could be generically exposed through the OpenWhisk's API Gateway by defining a generic API Facade on all URIs starting with `github.com`. Bellow is a snippet of the API Gateway generic config:
 
 ```nginx
 location ~ ^/github.com/(?<git_org>[^\/].*?)/(?<git_repo>[^\/].*?)/(?<git_branch>[^\/].*?)/(?<package>[^\/].*?)/(?<action>[^\/].*) {
     proxy_pass http://whisk_controller/api/v1/namespaces/guest/actions/${git_org}.${git_repo}.${git_branch}_${package}/${action}?blocking=true&result=true;
   }
 ```

### Deploying an action using github-deployer

1. Create a new GitHub Repo with your function. You can use the [hello-world-function](test/resources/hello-world-function) in this repo. 

2. Setup a new GitHub web hook
  * Manually
  
    In GitHub UI go to `>Settings` `>Hooks & services` `>Add webhook`. 
    In `Payload URL` enter:

     ```
     https://<username>:<password>@my.openwhisk.example.com/api/v1/namespaces/guest/actions/github-deployer?blocking=true
     ``` 
     > TIP: You can make the `Payload URL` nicer to developers by creating an API Facade like `https://<username>:<password>@my.openwhisk.example.com/github/webhook` . 
     In the API Gateway config define a new endpoint similar to the one bellow:
     ```nginx 
     location /github/webhook {
        proxy_pass http://whisk_controller/api/v1/namespaces/guest/actions/github-deployer?blocking=true&result=true;
     }
     ```
     
 * Via OpenWhisk feeds
    This setup provides a greater flexibility to configure a GitHub webhook to deploy an action.

    For more details see [Using the GitHub package](https://github.com/openwhisk/openwhisk-catalog#using-the-github-package) from the OpenWhisk catalog.
    
3. Make a push in the repository
4. See the deploy result.
 
   Using the GitHub UI go into `>Settings` `>Hooks & services` and click on the hook added at step 2. Then open the Recent Delivery, Response tab. You should see:
   ```javascript
   {
     "action_endpoint": "https://my.openwhisk.example.com/api/v1/namespaces/guest/actions/<git_org>.<git_repo>.<git_branch>_<mainfest_package>/<action>"
   }
   ``` 
   Use the `action_endpoint` to invoke the action. 
   ```bash
   curl -X POST <action_endpoint>
   ```

### Adding default parameters to actions 

Actions may be configured with default parameters. They can be used to set credentials needed to communicate with other services, i.e. api keys, client secrets, tokens, etc, information that shouldn't be committed in the source code.

An easy way to define default parameters using webhooks is to pass them as query parameters in the webhook URL. 
The API Gateway can read them from the query string and pass them to the github-deployer action.
The manifest.yaml should also explicitely define the parameters for actions. If there's a match with a query string parameters in the webhook URL then its value is used to configure a default parameter for the action. 
 
An example to illustrate this:
 
```yaml
package:
  name: helloworld
  version: 1.0
  license: Apache-2.0
  actions:
    hello:
      version: 1.0
      location: src/greeting.js
      runtime: nodejs@6
      inputs:
        param1:
          type: String
          description: A parameter for the action
        param2:
          type: String
          description: Another parameter for the action

``` 
 
This yaml defines the `hello` function with 2 input parameters: `param1`, `param2`.
 
 To set a default value for `param1` add a query string to the webhook URL. For example : 
 
 ```
https://my.openwhisk.example.com/github/webhook?param1=value1
```

 The webhook URL configuration in the API Gateway:
 
```nginx
location /github/webhook {
        lua_need_request_body on;
        access_by_lua_block {
                local cjson = require "cjson"
                --1. read request body as JSON
                ngx.req.read_body()
                local data = ngx.req.get_body_data()
                local json_data = {}

                if (data ~= nil and #data > 0 ) then
                    json_data = assert( cjson.decode(data), "Could not read body as JSON:" .. tostring(data))
                end

                --2. pass in default parameters to the action
                local args = ngx.req.get_uri_args()
                json_data.parameters = args

                --3. update the body data
                local new_body = assert( cjson.encode(json_data),  "Could not set body as JSON")
                ngx.req.set_body_data(new_body)
       }
       
       set $backend http://whisk_controller/api/v1/namespaces/guest/actions/github-deployer;
       proxy_pass $backend?blocking=true&result=true;
}
```
 
