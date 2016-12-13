import chai from 'chai';
import {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import wskdeploy from '../../src/action/wskdeploy/wskdeploy';
import nock from 'nock';
import fs from 'fs';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('Deploy ', () => {
    describe('from a simple manifest.yaml', function () {
        it('should read the information correctly', (done) => {
            var fn = new wskdeploy('manifest.yaml', './test/resources/hello-world-function/');
            fn._loadManifest()
                .should.be.fulfilled
                .and.should.eventually.deep.equal({
                package: {
                    name: 'helloworld',
                    version: 1,
                    license: 'Apache-2.0',
                    actions: {
                        hello: {
                            version: 1.0,
                            location: 'src/greeting.js',
                            runtime: 'nodejs@6'
                        }
                    }
                }
            })
                .and.notify(done);
        });
        it('should send the deploy info', (done) => {
            var fn = new wskdeploy('manifest.yaml', './test/resources/hello-world-function/');
            fn.deploy()
                .should.be.fulfilled
                .and.should.eventually.deep.equal(
                    {

                    }
                    ).and.notify(done);
        });
    })
});
