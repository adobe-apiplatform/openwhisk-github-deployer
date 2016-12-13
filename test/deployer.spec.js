import chai from 'chai';
import {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import action from '../src/action/deployer.js';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('Download archive', () => {
    describe('get ZIP', () => {
        it('should be able to download the zip', (done) => {
            var params = {
                "repository": {
                    "archive_url": "https://api.github.com/repos/ddragosd/openwhisk-github-deployer/{archive_format}{/ref}",
                }
            };
            action(params)
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
