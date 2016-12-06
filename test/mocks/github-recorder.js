import nock from 'nock';
import fs from 'fs';

/**
 * Records GitHub HTTP requests and corrects the application/zip responses for replay
 * @param github_requests_file - The file to save the requests into
 */
var record = function(github_requests_file) {
    fs.writeFile(github_requests_file, '//recorded on ' + new Date() + "\n");
    nock.recorder.rec({
        output_objects: false,
        use_separator: false,
        logging: (content) => {
            var correct_content = content;
            if (content.indexOf("application/zip") > 0) {
                // the binary content is saved as a hex string
                // to respond with a binary like ( `xxd -r -p ./repo1.zip repo2.zip` )
                // edit the response for the file with:
                //      reply(200, Buffer.from( <hex_string>, 'hex'), ... )
                // instead of:
                //     reply(200, <hex_string>, ... )
                const regex = /reply\(200\,.*(\"\w+\")/gm;
                const subst = `reply(200, Buffer.from(\$1, 'hex')`;
                correct_content = content.replace(regex, subst);
            }
            fs.appendFile(github_requests_file, 'var nock = require("nock");' + correct_content);
        }
    });
};

module.exports = {
    saveAll : record
};