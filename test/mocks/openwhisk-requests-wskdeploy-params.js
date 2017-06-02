//recorded on Mon Feb 06 2017 14:37:15 GMT-0800 (PST)
var nock = require("nock");
nock('https://localhost:443', {"encodedQueryParams":true})
  .get('/api/v1/namespaces/guest/packages/wskdeploy-spec_helloworld')
  .reply(200, {"name":"wskdeploy-spec_helloworld","binding":{},"publish":false,"annotations":[],"version":"0.0.1","actions":[],"parameters":[],"namespace":"guest","feeds":[]}, [ 'Date',
  'Mon, 06 Feb 2017 22:27:31 GMT',
  'Content-Type',
  'application/json; charset=UTF-8',
  'Content-Length',
  '201',
  'Connection',
  'close',
  'Access-Control-Allow-Origin',
  '*',
  'Access-Control-Allow-Headers',
  'Authorization, Content-Type',
  'Server',
  'openwhisk/api-gateway-1.9.3.1' ]);
var nock = require("nock");
nock('https://localhost:443', {"encodedQueryParams":true})
  .put('/api/v1/namespaces/guest/actions/wskdeploy-spec_helloworld/hello', {"exec":{"kind":"nodejs:default","code":"/**\n * Return a simple greeting message for someone.\n *\n * @param name A person's name.\n * @param place Where the person is from.\n */\nfunction main(params) {\n    var name = params.name || params.payload || 'stranger';\n    var place = params.place || 'somewhere';\n    return {payload:  'Hello, ' + name + ' from ' + place + '!'};\n}"},"parameters":[{"key":"param1","value":"value1"},{"key":"param2","value":"value2"}]})
  .query({"overwrite":"true"})
  .reply(200, {"name":"hello","publish":false,"annotations":[{"key":"exec","value":"nodejs:6"}],"version":"0.0.1","exec":{"kind":"nodejs:6","code":"/**\n * Return a simple greeting message for someone.\n *\n * @param name A person's name.\n * @param place Where the person is from.\n */\nfunction main(params) {\n    var name = params.name || params.payload || 'stranger';\n    var place = params.place || 'somewhere';\n    return {payload:  'Hello, ' + name + ' from ' + place + '!'};\n}","binary":false},"parameters":[{"key":"param1","value":"value1"},{"key":"param2","value":"value2"}],"limits":{"timeout":60000,"memory":256,"logs":10},"namespace":"guest/wskdeploy-spec_helloworld"}, [ 'Date',
  'Mon, 06 Feb 2017 22:27:32 GMT',
  'Content-Type',
  'application/json; charset=UTF-8',
  'Content-Length',
  '792',
  'Connection',
  'close',
  'Access-Control-Allow-Origin',
  '*',
  'Access-Control-Allow-Headers',
  'Authorization, Content-Type',
  'Server',
  'openwhisk/api-gateway-1.9.3.1' ]);
