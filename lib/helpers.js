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


// Function generates a string of random alphanemeric characters, of a specified lenght
helpers.createRandomString = strLength => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define all the possible characters that could go into a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwsyz0123456789';

        // Start generating the final string
        let str = '';
        for (i = 1; i <= strLength; i++){
            // Generate a random character from the possibleCharacters string
                /**CharAt - Grabs a random number between d first * last positions of d possibleCharaters string
                 * d position is gotten from Math.random which give us a random number that we multiply by d length
                 *  of d possibleCharacters
                */
            const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
            // append this character to the final string
            str += randomCharacter;
        }

        // Return the final string
        return str;
    } else {
        return false;
    }
};


// Export container
module.exports = helpers;


