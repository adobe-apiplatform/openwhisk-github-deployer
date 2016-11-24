import chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import github_client from '../../src/action/github/github-client';
import nock from 'nock';
import fs from 'fs';
import vm from 'vm';

// sets up mock HTTP responses
import mocks from '../../github-record.txt';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('Download ', () => {
    describe('get ZIP from GitHub', function() {
        // when using "this", make sure to avoid ES6 arrow functions.
        // see: https://babeljs.io/docs/faq/#why-is-this-being-remapped-to-undefined-
        this.timeout(10000);

        it('should be able to download the zip archive', (done) => {
            var params = {
                "repository": {
                    "name": "repo1",
                    "archive_url": "https://api.github.com/repos/ddragosd/openwhisk-github-deployer/{archive_format}{/ref}",
                }
            };
            /*nock.recorder.rec({
                output_objects: false,
                use_separator: false,
                logging: (content) => {
                    fs.appendFile('github-record.txt', 'var nock = require('nock');' + content);
                    // the binary content is saved as a hex string
                    // to convert it to binary use: xxd -r -p ./repo1.zip repo2.zip
                }
            });

            */
            var git = new github_client();
            git.getArchive(params.repository).should.eventually.deep.equal({"a":"b"});
            // TODO: test that the file named repo1.zip exists and that is has the correct size
            // done();
            // var nockCalls = nock.recorder.play();
            // var nocks = nock.load('github-record.txt');

        });
    })
});
