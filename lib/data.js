/**
 * Library for storing and editing data
 */

// Dependencies
const fs = require('fs');
const path = require('path');


// Create container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// Write data to file
/** CREATE is a function that takes d DIR name within .data that we want to write data into, FILE is d actual
 *  filename inside DIR that we want to write our data into, DATA is d data we want to add to FILE. And a callback
 *  wx flag opens d file for writing & fs does not errors out if the file doesn't exist yet
 */
lib.create = (dir, file, data, callback) => {
    // Open the file for writing. fileDescriptor is a unique identifier for d file
    fs.open(lib.baseDir + dir + '/'+file+'.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to string
            const stringData = JSON.stringify(data);

            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, err => {
                if (!err) {
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            callback(false);
                        }else{
                            callback('Error closing new file.')
                        }
                    });
                }else{
                    callback('Error writing to file.')
                }
            })
        }else{
            callback('Could not create new file, it may already exist.');
        }
    });
};

// Read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data) => {
        callback(err, data);
    });
};


// Update data inside a file
/**r+ flag opens d file for writing & errors out if the file doesn't exist yet */
lib.update = (dir, file, data, callback) => {
    // open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // convert data to string
            const stringData = JSON.stringify(data);
            
            // Truncate the file
            fs.ftruncate(fileDescriptor, err => {
                if (!err) {
                    // write to the file and close it
                    fs.writeFile(fileDescriptor, stringData, err => {
                        if (!err) {
                            fs.close(fileDescriptor, err=> {
                                if (!err) {
                                    callback(false)
                                }else{
                                    callback('Error closing exising file.');
                                }
                            });
                        }else{
                            callback('Error writing to existing file.');
                        }
                    });
                }else{
                    callback('Error truncating file content.')
                }
            })
        }else{
            callback('Could not open file for updating, it may not exist yet.')
        }
    });
};

// Delete a file
lib.delete = (dir, file, callback) => {
    // Unlink the file
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', err=> {
        if (!err) {
            callback(false);
        }else{
            callback('Error deleting existing file');
        }
    })
}



// Export the module
module.exports = lib;