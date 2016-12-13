import chai from 'chai';
import {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import github_client from '../../src/action/github/github-client';
import nock from 'nock';
import fs from 'fs';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('Download ', () => {
    describe('get ZIP from GitHub', function () {
        // when using "this", make sure to avoid ES6 arrow functions.
        // see: https://babeljs.io/docs/faq/#why-is-this-being-remapped-to-undefined-
        this.timeout(2000);

        it('should be able to download the zip archive', (done) => {
            var params = {
                "repository": {
                    "name": "openwhisk-github-deployer",
                    "archive_url": "https://api.github.com/repos/ddragosd/openwhisk-github-deployer/{archive_format}{/ref}",
                }
            };

            // uncomment the 2 lines bellow to automatically save a new recording for the real GitHub requests
            // var recorder = require('../../test/mocks/github-recorder');
            // recorder.saveAll('./test/mocks/github-requests.txt');

            // play the recorded HTTP responses
            var mocks = require('../../test/mocks/github-requests.txt');

            var git = new github_client();
            git.getArchive(params.repository)
                .should.be.fulfilled
                .and.should.eventually.deep.equal(
                    {
                        "result": true,
                        "path": "openwhisk-github-deployer/ddragosd-openwhisk-github-deployer-02545eb"
                    })
                .and.notify(done);
        });

        it('should return with error on 404', (done) => {
            var params = {
                "repository": {
                    "name": "INVALID",
                    "archive_url": "https://api.github.com/repos/INVALID/INVALID/{archive_format}{/ref}",
                }
            };

            // uncomment the 2 lines bellow to automatically save a new recording for the real GitHub requests
            // var recorder = require('../../test/mocks/github-recorder');
            // recorder.saveAll('./test/mocks/github-requests-404.txt');

            // play the recorded HTTP responses
            var mocks = require('../../test/mocks/github-requests-404.txt');

            var git = new github_client();
            git.getArchive(params.repository)
                .should.be.rejected
                .and.notify(done);
        });

        it('should error with invalid URI/PORT', (done) => {
            var params = {
                "repository": {
                    "name": "repo1",
                    "archive_url": "https://127.0.0.255:0",
                }
            };
            var git = new github_client();
            git.getArchive(params.repository)
                .should.be.rejected
                .and.notify(done);
        });

    })
});
