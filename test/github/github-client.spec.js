import chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import github_client from '../../src/action/github/github-client';
import nock from 'nock';
import fs from 'fs';
import vm from 'vm';

// sets up mock HTTP responses
import mocks from '../../test/mocks/github-requests.txt';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

describe('Download ', () => {
    describe('get ZIP from GitHub', function() {
        // when using "this", make sure to avoid ES6 arrow functions.
        // see: https://babeljs.io/docs/faq/#why-is-this-being-remapped-to-undefined-
        this.timeout(2000);

        it('should be able to download the zip archive', (done) => {
            var params = {
                "repository": {
                    "name": "repo1",
                    "archive_url": "https://api.github.com/repos/ddragosd/openwhisk-github-deployer/{archive_format}{/ref}",
                }
            };
            //
            // uncomment the lines bellow to automatically save a new recording for the reald GitHub requests
            //
            /*var github_requests_file = './test/mocks/github-requests.txt';
            fs.writeFile(github_requests_file, '//recorded on ' + new Date() + "\n");
            nock.recorder.rec({
                output_objects: false,
                use_separator: false,
                logging: (content) => {
                    var correct_content = content;
                    if (content.indexOf("application/zip") > 0 ) {
                        // the binary content is saved as a hex string
                        // to respond with a binary like ( `xxd -r -p ./repo1.zip repo2.zip` )
                        // edit the response for the file with:
                        //      reply(200, Buffer.from( <hex_string>, 'hex'), ... )
                        // instead of:
                        //     reply(200, <hex_string>, ... )
                        correct_content = correct_content.replace("\"504b0304", 'Buffer.from("504b0304');
                        correct_content = correct_content.replace("[ 'Content-Length'", "'hex'), [ 'Content-Length'");
                    }
                    fs.appendFile(github_requests_file, 'var nock = require("nock");' + correct_content);
                }
            });*/
            // end of recording GitHub requests

            var git = new github_client();
            git.getArchive(params.repository).should.eventually.deep.equal({"a":"b"});
            // TODO: test that the file named repo1.zip exists and that is has the correct size
            // done();
            // var nockCalls = nock.recorder.play();
            // var nocks = nock.load('github-record.txt');

        });
    })
});
