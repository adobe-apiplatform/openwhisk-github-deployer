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
        it('should return the deploy info correctly', (done) => {
            // uncomment the 2 lines bellow to automatically save a new recording for the real GitHub requests
            // var recorder = require('../../test/mocks/github-recorder');
            // recorder.saveAll('./test/mocks/openwhisk-requests-wskdeploy.js');

            // play the recorded HTTP responses
            var mocks = require('../../test/mocks/openwhisk-requests-wskdeploy');

            var fn = new wskdeploy('manifest.yaml', './test/resources/hello-world-function/', {
                namespace: "wskdeploy-spec"
            });
            fn.deploy()
                .should.be.fulfilled
                .and.should.eventually.deep.equal(
                {
                    manifest: {
                        package: {
                            openwhisk_name: 'wskdeploy-spec_helloworld',
                            name: 'helloworld',
                            version: 1,
                            license: 'Apache-2.0',
                            actions: {hello: {version: 1, location: 'src/greeting.js', runtime: 'nodejs@6'}}
                        }
                    },
                    actions: [{
                        name: 'hello',
                        publish: false,
                        annotations: [{
                            "key": "exec",
                            "value": "nodejs:6"
                        }],
                        version: '0.0.1',
                        exec: {
                            kind: 'nodejs:6',
                            code: '/**\n * Return a simple greeting message for someone.\n *\n * @param name A person\'s name.\n * @param place Where the person is from.\n */\nfunction main(params) {\n    var name = params.name || params.payload || \'stranger\';\n    var place = params.place || \'somewhere\';\n    return {payload:  \'Hello, \' + name + \' from \' + place + \'!\'};\n}',
                            binary: false
                        },
                        parameters: [],
                        limits: {timeout: 60000, memory: 256, logs: 10},
                        namespace: 'guest/wskdeploy-spec_helloworld'
                    }]
                }
            ).and.notify(done);
        });
    });

    describe('using default parameters', function () {
        it('should create the action correctly', (done) => {

            // uncomment the 2 lines bellow to automatically save a new recording for the real GitHub requests
            // var recorder = require('../../test/mocks/github-recorder');
            // recorder.saveAll('./test/mocks/openwhisk-requests-wskdeploy-params.js');

            // play the recorded HTTP responses
            var mocks = require('../../test/mocks/openwhisk-requests-wskdeploy-params');

            var fn = new wskdeploy('manifest-params.yaml', './test/resources/hello-world-function/', {
                    namespace: "wskdeploy-spec"
                },
                /* default_parameters */ {
                    "param1": "value1",
                    "param2": "value2",
                    "param3": "value3",
                    "param4": "value4"
                });
            fn.deploy()
                .should.be.fulfilled
                .and.should.eventually.deep.equal({
                manifest: {
                    package: {
                        openwhisk_name: 'wskdeploy-spec_helloworld',
                        name: 'helloworld',
                        version: 1,
                        license: 'Apache-2.0',
                        actions: {
                            hello: {
                                inputs: {
                                    param1: {
                                        description: "A parameter for the action",
                                        type: "String"
                                    },
                                    param2: {
                                        description: "Another parameter for the action",
                                        type: "String"
                                    }
                                },
                                location: "src/greeting.js",
                                runtime: "nodejs@6",
                                version: 1
                            }
                        }
                    }
                },
                actions: [{
                    name: 'hello',
                    publish: false,
                    annotations: [{
                        "key": "exec",
                        "value": "nodejs:6"
                    }],
                    version: '0.0.1',
                    exec: {
                        kind: 'nodejs:6',
                        code: '/**\n * Return a simple greeting message for someone.\n *\n * @param name A person\'s name.\n * @param place Where the person is from.\n */\nfunction main(params) {\n    var name = params.name || params.payload || \'stranger\';\n    var place = params.place || \'somewhere\';\n    return {payload:  \'Hello, \' + name + \' from \' + place + \'!\'};\n}',
                        binary: false
                    },
                    parameters: [
                        {
                            "key":"param1",
                            "value":"value1"
                        },
                        {
                            "key":"param2",
                            "value":"value2"
                        }
                    ],
                    limits: {timeout: 60000, memory: 256, logs: 10},
                    namespace: 'guest/wskdeploy-spec_helloworld'
                }]
            }).and.notify(done);

        });
    });
});
