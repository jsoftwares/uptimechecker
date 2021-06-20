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

// Users - post
    /**Required fields: firstname, lastname, phone, password, tosAgreement
     * Optional fields: none
     */
handlers._users.POST = (data, callback) => {
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
                            callback(200, {message: 'User created'});
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

// Users - get
    /**Required data: phone
     * Optional data: none
     * @TODO only allow an authenticated user access only their own object
     */
handlers._users.GET = (data, callback) => {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 13 ? data.queryStringObject.phone : false;
    if (phone) {
        // Lookup user phone number
        _data.read('users', phone, (err, data) => {
            if (!err && data) {
                // Remove d hashed password from d user object before returning it to the requester 
                delete data.password;
                callback(200, data);
            }else {
                callback(404, {Error: 'User not found.'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required field.'})
    }

};

// Users put
handlers._users.PUT = (data, callback) => {

    /**Required data: phone
     * Optional data: firstName, LastName, password (atleast one must be specified)
     * @TODO only allow an authenticated user update only their own object
     */

    // Validate required field
     const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 13 ? data.payload.phone : false;

    //  Validate optional fields
    const firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    const lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    
    // Error out if phone is  invalid
    if (phone) {
        // Error out if nothing is sent for update
        if (firstName || lastName || password) {
            _data.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    // Udate necessary fields
                    if (firstName) {
                        userData.firstName = firstName;
                    }
                    if (lastName) {
                        userData.lastName = lastName;
                    }
                    if (password) {
                        userData.password = helpers.hash(password);
                    }

                    // store the new updates
                    _data.update('users', phone, userData, err=> {
                        if (!err) {
                            callback(200, {message: 'User updated.'})
                        } else {
                            console.log(err);
                            //this is a 500 bcos its sth that has to do with our system not being able to update the file & nothing to do with the user payload
                            callback(500, {Error: 'Could not update the user.'});
                        }
                    });
                } else {
                    callback(400, {Error: 'The specified user does not exist.'});
                }
            })
        } else {
            callback(400, {Error: 'Missing or invalid field to update.'});
        }
    } else {
        callback(400, {Error: 'Missing or invalid required field.'});
    }
};

// Users delete
handlers._users.DELETE = (data, callback) => {
    
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