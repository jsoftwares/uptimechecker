/**
 * Requests handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Create container for the module (to be exported)
const handlers = {};

handlers.users = (data, callback) => {
    const accpetableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    // if data.method (ie method from uers req) exists within the acceptableMethods array
    if (accpetableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    }else{
        callback(405); //405 method not allowed
    }
};

// Container for the users submethods
handlers._users = {};

// Users post
    /**Required fields: firstname, lastname, phone, password, tosAgreement
     * Optional fields: none
     */
handlers._users.post = (data, callback) => {
    // Check that all required fields are supplied
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 13 ? data.payload.phone.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;
    
    if (firstName && lastName && phone && password && tosAgreement) {
        // Check to see that user doesn't exist already
        _data.read('users', phone, (err, fd) => {
            if (err) {
                // Hash the password
                const hashedPassword = helpers.hash(password);

                if (hashedPassword) {
                    // create user object
                    const userObject = {
                        firstName,
                        lastName,
                        phone,
                        password: hashedPassword,
                        tosAgreement
                    };
    
                    // store the user
                    _data.create('users', phone, userObject, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, {Error: 'Could not create the new user.'});
                        }
                    });
                }else{
                    callback(400, {Error: 'User with this phone number already exist.'})
                }
                    
            } else {
                callback(500, {Error: 'Could not hash the user\'s password.'});
            }

        });
    } else {
        callback(400, {Error: 'Missing required fields.'});
    }
};

// Users get
handlers._users.get = (data, callback) => {
    
};

// Users put
handlers._users.put = (data, callback) => {
    
};

// Users delete
handlers._users.delete = (data, callback) => {
    
};

handlers.ping = (data, callback) => {
    // 
    callback(200);
}

handlers.notFound = (data, callback) => {
    callback(404);
}

// Export module
module.exports = handlers;