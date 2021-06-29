/**
 * Requests handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// Create container for the module (to be exported)
const handlers = {};

// USERS
handlers.users = (data, callback) => {
    const accpetableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    // if data.method (ie method from uers req) exists within the acceptableMethods array
    if (accpetableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    }else{
        callback(405); //405: method not allowed
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
     */
handlers._users.GET = (data, callback) => {
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 13 ? data.queryStringObject.phone : false;
    if (phone) {

        // Get token from request header
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number/user
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
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
                callback(401, {Error: 'Unauthorized.'})
            }
        });
    } else {
        callback(400, {Error: 'Missing required field.'})
    }

};

// Users - PUT
/**Required data: phone
 * Optional data: firstName, LastName, password (atleast one must be specified)
 * @TODO only allow an authenticated user update only their own object
 */
handlers._users.PUT = (data, callback) => {


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

            // Get token from request header
            const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid for the phone number/user
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if (tokenIsValid) {
                    
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
    
                    });
                } else {
                    callback(401, {Error: 'Unauthorized.'})
                }
            });
            
        } else {
            callback(400, {Error: 'Missing or invalid field to update.'});
        }

        
    } else {
        callback(400, {Error: 'Missing or invalid required field.'});
    }
};

// Users - delete
/**Required data: phone
*/
handlers._users.DELETE = (data, callback) => {

    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 13 ? data.queryStringObject.phone : false;
    if (phone) {
        // Get token from request header
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid for the phone number/user
        handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
            if (tokenIsValid) {
                // Lookup user phone number
                _data.read('users', phone, (err, userData) => {
                    if (!err && userData) {
                        // Delete the user 
                        _data.delete('users', phone, (err) => {
                            if (!err) {
                                // delete each of the checks associated with the user
                                const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                const checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    let checksDeleted = 0;
                                    let deletionErrors = false;
                                    // Loop through the checks
                                    userChecks.forEach(checkId => {
                                        _data.delete('checks', checkId, err => {
                                            if (err) {
                                                deletionErrors = true;
                                            }

                                            checksDeleted++;
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200, {message: 'User deleted and associated checks deleted.'})
                                                } else {
                                                    callback(500, {Error: 'Errors encountered while trying to delete all user\'s checks. All checks may not have been deleted.'})
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    // callback 200 because there would be nothing to delete if checks to delete is not more than 0
                                    callback(200);
                                }
                            } else {
                                callback(500, {Error: 'Could not delete the specified user.'});
                            }
                        });
                    }else {
                        callback(404, {Error: 'User not found.'})
                    }
                });
                
            } else {
                callback(401, {Error: 'Unauthorized.'})
            }
        });
    } else {
        callback(400, {Error: 'Missing or invalid required field.'})
    }
    
};


// TOKENS
handlers.tokens = (data, callback) => {
    const accpetableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    // if data.method (ie method from the req) exists within the acceptableMethods array
    if (accpetableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    }else{
        callback(405); //405: method not allowed
    }
};

// Container for the tokens submethods methods
handlers._tokens = {};

// Tokens - POST
/**Required data: phone, password
 * Optional data: none
 */
handlers._tokens.POST = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 13 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone && password) {
    // Lookup user which matches that phone number
    _data.read('users', phone, (err, userData) => {
        if (!err && userData) {
            // Hash the password in req, and compare it to d password store in the user object
            const hashedPassword = helpers.hash(password);
            if (hashedPassword === userData.password) {
                // If valid, create a new token with a random name. Set expiration date to 1 hour
                const tokenId = helpers.createRandomString(20);
                const expires = Date.now() + 1000 * 60 * 60;
                const tokenObject = {
                    phone,
                    id: tokenId,
                    expires
                };

                // Store the token
                _data.create('tokens', tokenId, tokenObject, err => {
                    if (!err) {
                        callback(200, tokenObject);
                    } else {
                        callback(500, {'Error': 'Could not create token.'});
                    }
                });
            } else {
                callback(400, {Error: 'Invalid password.'})
            }
        } else {
            callback(400, {'Error': 'User not found.'})
        }
    });
  }else {
      callback(400, {'Error' : 'Missing or invalid required field(s)'});
  }
};

// Tokens - GET
/**Required data: id
 * Optional data: none
 */
handlers._tokens.GET = (data, callback) => {
    console.log(data.queryStringObject.id + '  ' + data.queryStringObject.id.trim() );
    // check that the id is valid
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        // lookup token
        _data.read('tokens', id, (err, tokenObject) => {
            if (!err && tokenObject) {
                callback(200, tokenObject);
            } else {
                callback(500, {Error: 'Could not read token.'});
            }
        });
    } else {
        callback(400, {Error: 'Missing of invalid required field.'});
    }
};

// Tokens - PUT
/**Allow user to extend d expiry of a token. No need to update anything,
 * Required data: id, extend
 * Optional data: none
 */

handlers._tokens.PUT = (data, callback) => {
    // check that the payload is valid
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend == true ? true : false;
    if (id && extend) {
        // Lookup the token
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // Check to make sure token isn't already expired(only active tokens expiration should be extended)
                if (tokenData.expires > Date.now()) {
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 *60;

                    // store the new update
                    _data.update('tokens', id, tokenData, err=> {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, {'Error': 'Could not update the token\s expiration.'})
                        }
                    });
                } else {
                    callback(400, {Error: 'The token has already expired and cannot be extended.'});
                }
            } else {
                callback(400, {Error: 'Token does not exist.'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing or invalid required field(s)'});   
    }
};

// Users - delete
/**Required data : id
 * Optional data : none
*/
handlers._tokens.DELETE = (data, callback) => {

    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        // Lookup token with this id
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                // Delete the token 
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200, {message: 'Token deleted.'});
                    } else {
                        callback(500, {Error: 'Could not delete the specified token.'});
                    }
                });
            }else {
                callback(404, {Error: 'Token not found.'});
            }
        });
    } else {
        callback(400, {Error: 'Missing or invalid required field.'});
    }
    
};

// CHECKS
handlers.checks = (data, callback) => {
    const accpetableMethods = ['POST', 'GET', 'PUT', 'DELETE'];
    // if data.method (ie method from user req) exists within the acceptableMethods array
    if (accpetableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    }else{
        callback(405, {Error: 'Method not allowed.'}); //405: method not allowed
    }
};

// Container for the checks methods
handlers._checks = {};

// Checks - POST
    /**Required fields: protocol, url, method, successCode, timeoutSeconds  
     * Optional fields: none
     * timeoutSeconds should me a whole number
     */
handlers._checks.POST = (data, callback) => {
    // validate inputs
    const protocol = typeof(data.payload.protocol) === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;

    if (protocol, url, method, successCodes, timeoutSeconds) {
        // Get user token from request header
        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

        // validate token
    
        // Lookup the user by reading the token
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const userPhone = tokenData.phone
    
                // Lookup the user data
                _data.read('users', userPhone, (err, userData)=>{
                    if (!err && userData) {
                        // look if check key exists in user object, otherwise we create it & assign an empty array to it
                        const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // verify that the user has less than the number of max-checks-per-user
                        if (userChecks.length < config.maxChecks) {
                            // create random ID for the check
                            const checkId = helpers.createRandomString(20);
    
                            // create the check object and include the user's phone
                            const checkOjbect = {
                                id: checkId,
                                userPhone,
                                protocol,
                                url,
                                method,
                                successCodes,
                                timeoutSeconds
                            };
                            // persist the check for user
                            _data.create('checks', checkId, checkOjbect, err=> {
                                if (!err) {
                                    // add the checkId to the user's object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);
    
                                    // save the updated user data
                                    _data.update('users', userPhone, userData, err=> {
                                        if (!err) {
                                            callback(200, checkOjbect);
                                        } else {
                                            callback(200, {'Error': 'Could not update the user with the new check.'})
                                        }
                                    });
                                } else {
                                    callback(500, {Error: 'Could not create the new check.'})
                                }
                            });
                        } else {
                            callback(400, {Error: 'User already has the maximum number of checks ('+config.maxChecks+')'});
                        }
                    } else {
                        // token in header does not correspond with user.
                        callback(401, {Error: 'Unauthorized.'});
                    }
                });
            } else {
                callback(401, {Error: 'Unauthorized.'})
            }
        });
        
    } else {
        callback(400, {Error: 'Missing or invalid required field.'});
    }
};


// Checks - GET
    /**Required data: id
     * Optional data: none
     */
     handlers._checks.GET = (data, callback) => {
        const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
        if (id) {

            // Lookup the check
            _data.read('checks', id, (err, checkData)=> {
                if (!err, checkData) {
                    // Get token from request header
                    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                    // Verify that the token in header is valid and belongs to the user who created the check we want to get
                    handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                        if (tokenIsValid) {
                            callback(200, checkData);
                        } else {
                            callback(401, {Error: 'Unauthorized.'})
                        }
                    }); 
                } else {
                    callback(404, {Error: 'Check not found.'});
                }
            });
        } else {
            callback(400, {Error: 'Missing or invalid required field.'});
        }
    
    };


// Checks - PUT
/**Required data: id
 * Optional data: protocol, url, method, successCodes, timeoutSeconds (at least one must be sent)
 */

handlers._checks.PUT = (data, callback) => {
    // validate required inputs
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length == 20 ? data.payload.id : false;

    // validate optional inputs
    const protocol = typeof(data.payload.protocol) === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds : false;
    
    if (id) {
        // enure at least one optional field has been submitted
        if (protocol || url || method || successCodes || timeoutSeconds) {
            
            // Lookup check
            _data.read('checks', id, (err, checkData)=> {
                if (!err && checkData) {
                    const token = typeof(data.headers.token) === 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;
                    // verify token to ensure it's valid & belongs to the user that created the check
                    handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid=> {
                        if (tokenIsValid) {
                            // Update check where necessary
                            if (protocol) {
                                checkData.protocol = protocol;
                            }
                            if (url) {
                                checkData.url = url;
                            }
                            if (method) {
                                checkData.method = method;
                            }
                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            // persist the new check
                            _data.update('checks', id, checkData, err => {
                                if (!err) {
                                    callback(200, {message: 'Check updated'});
                                } else {
                                    callback(500, {Error: 'Could not update check.'})
                                }
                            })
                        } else {
                           callback(401, {Error: 'Unauthorized.'}) 
                        }
                    });
                } else {
                    callback(500, {'Error': 'Check not found.'})
                }
            });
        } else {
            callback(400, {Error: 'Missing or invalid field to update.'});
        }
    } else {
        callback(400, {Error: 'Missing or invalid required field.'});
    };
};


// Checks - DELETE
/**Required data: id
 * Optional data:none
 */
handlers._checks.DELETE = (data, callback) => {
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id : false;
    if (id) {
        // Lookup check
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {

                const token = typeof(data.headers.token) === 'string' && data.headers.token.trim().length == 20 ? data.headers.token : false;
                    // verify token to ensure it's valid & belongs to the user that created the check
                    handlers._tokens.verifyToken(token, checkData.userPhone, tokenIsValid=> {
                        if (tokenIsValid) {
                            // Delete the check 
                            _data.delete('checks', id, (err) => {
                                if (!err) {
                                    // Lookup the user 
                                    _data.read('users', checkData.userPhone, (err, userData) => {
                                        if (!err && userData) {
                                            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

                                            // remove the deleted check IDs from user's list of checks
                                            const checkPosition = userChecks.indexOf(id);
                                            if (checkPosition > -1) {
                                                // userData.checks.splice(checkPosition, 1);
                                                const updatedUserChecks = userChecks.filter( checkId=> checkId !== id);
                                                userData.checks = updatedUserChecks;
                                                // Re-save the user's Data
                                                _data.update('users', checkData.userPhone, userData, err=> {
                                                    if (!err) {
                                                        callback(200, {message: 'Check deleted and user data updated.'});
                                                    }else {
                                                        callback(500, {Error: 'Could not update the user\'s data'});
                                                    }
                                                });
                                            } else {
                                                callback(500, {Error: 'Could not find the check on the user\'s object, so could not remove it from the list of user\'s checks '})
                                            }
                                        } else {
                                            callback(500, {Error: 'Could not find the User that created the check, hence could not remove check from the user\'s Object.'});
                                        }
                                    });
                                } else {
                                    callback(500, {Error: 'Could not delete the specified check.'});
                                }
                            });
                            
                        } else {
                            callback(401, {Error: 'Unauthorized'});
                        }
                    });
            }else {
                callback(404, {Error: 'Check not found.'});
            }
        });
    } else {
        callback(400, {Error: 'Missing or invalid required field.'});
    }
};



/** General purpose function to verify that a given token id is currently valide for a given user.
 * The function has a callback function that a caller should implement; that returns a true or false
 */
handlers._tokens.verifyToken = (id, phone, callback) => {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            // Check that token is for the specified user & has not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
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