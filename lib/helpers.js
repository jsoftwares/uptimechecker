/**
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');


// Container for various helpers
const helpers = {};

// Creat a SHA256 hash: SHA256 hash is built into Node hence doesn't require any external library to use it
helpers.hash = (str) => {
    if (typeof(str) === 'string' && str.length > 0) {
        const hashStr = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hashStr;
    } else {
        return false;
    }
};


// Parse a JSON string to an object in all cases, without throwing
    /**This function takes an arbitrary string & either returns d JSON object from that string or returns false
     * The reason I'm doing this is bcos natively, Node or JS will just through an error if JSON.parse() is
     * trying to parse sth that is not a valid JSON and I don't want things to throw.
      */
helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (err) {
        return {};
    }
};


// Export container
module.exports = helpers;


