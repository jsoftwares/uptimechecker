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





// Export container
module.exports = helpers;


