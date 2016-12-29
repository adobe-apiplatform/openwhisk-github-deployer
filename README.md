OpenWhisk GitHub Deployer
==========================

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

#### Deploy the action in OpenWhisk

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


