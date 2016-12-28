import chai from 'chai';
import {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import action from '../src/action/deployer.js';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('Deploy', () => {
    describe('openwhisk package', function () {
        // when using "this", make sure to avoid ES6 arrow functions.
        // see: https://babeljs.io/docs/faq/#why-is-this-being-remapped-to-undefined-
        this.timeout(10000);

        it('should return correct info', (done) => {

            // uncomment the 2 lines bellow to automatically save a new recording for the real GitHub requests
            // var recorder = require('../test/mocks/github-recorder');
            // recorder.saveAll('./test/mocks/openwhisk-requests-deployer.js');

            // play the recorded HTTP responses
            var mocks = require('../test/mocks/openwhisk-requests-deployer');

            var event = {
                "ref": "refs/heads/wskdeploy_action",
                "repository": {
                    "name": "openwhisk-github-deployer",
                    "full_name": "ddragosd/openwhisk-github-deployer",
                    "archive_url": "https://api.github.com/repos/ddragosd/openwhisk-github-deployer/{archive_format}{/ref}",
                    "owner": {
                        "name": "ddragosd"
                    }
                }
            };

            action(
                /* git_event */ event,
                /* api_host */ "localhost",
                /* api_endpoint */ "https://localhost/api/v1/namespaces/guest/actions/{package}/{action}",
                /* manifest_file_location */ "/test/resources/hello-world-function")
                .should.be.fulfilled
                .and.should.eventually.deep.equal(
                {
                    "action_endpoint": "https://localhost/api/v1/namespaces/guest/actions/ddragosd.openwhisk-github-deployer.wskdeploy_action_helloworld/hello"
                }
            )
                .and.notify(done);

        });
    })
});
