import chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import WhiskInvokerStub from './WhiskInvokerStub';

chai.config.includeStack = true;
chai.use(chaiAsPromised);
chai.should();

var invoker = new WhiskInvokerStub('../src/action/deployer.js');

beforeEach( function() {
    return invoker.load()
                .then( function() {
                    return invoker
                })
})

describe('Download archive', () => {
    describe('get ZIP', () => {
        it('should be able to download the zip', (done) => {
            var params = {
              "repository": {
                  "archive_url": "https://api.github.com/repos/adobe-apiplatform/apigateway/{archive_format}{/ref}",
              }
            };

            invoker.run(params).should.eventually.deep.equal({payload: "Hello, World!"});
            done();
        });
    })
});
