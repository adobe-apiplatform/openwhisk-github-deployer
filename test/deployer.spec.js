import chai from 'chai';
import {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import action from '../src/action/deployer.js';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('Deploy', () => {
    describe('openwhisk package', () => {
        it('should return correct info', (done) => {
            var event = {
                "ref": "refs/heads/wskdeploy_action",
                "repository": {
                    "name": "openwhisk-github-deployer",
                    "full_name": "ddragosd/openwhisk-github-deployer",
                    "archive_url": "https://api.github.com/repos/ddragosd/openwhisk-github-deployer/{archive_format}{/ref}",
                }
            };
            action(event, "/test/resources/hello-world-function")
                .should.be.fulfilled
                .and.should.eventually.deep.equal(
                {
                    "path": "openwhisk-github-deployer/ddragosd-openwhisk-github-deployer-02545eb",
                    "result": true
                }
            )
                .and.notify(done);
        });
    })
});
