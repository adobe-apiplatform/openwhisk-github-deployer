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
            // uncomment the 2 lines bellow to automatically save a new recording for the real GitHub requests
            // var recorder = require('../../test/mocks/github-recorder');
            // recorder.saveAll('./test/mocks/openwhisk-requests-wskdeploy.txt');

            // play the recorded HTTP responses
            var mocks = require('../../test/mocks/openwhisk-requests-wskdeploy.txt');

            var fn = new wskdeploy('manifest.yaml', './test/resources/hello-world-function/', {
                namespace: "wskdeploy-spec"
            });
            fn.deploy()
                .should.be.fulfilled
                .and.should.eventually.equal("wskdeploy-spec_helloworld")
                /*.and.should.eventually.deep.equal(
                {
                    "annotations": [],
                    "binding": {},
                    "name": "guest_helloworld",
                    "namespace": "guest",
                    "parameters": [],
                    "publish": false,
                    "version": "0.0.5"
                }
            )*/.and.notify(done);
        });
    })
});
