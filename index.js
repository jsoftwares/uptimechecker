/**
 * Entry point for API
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

// Instantiating HTTP server
const httpServer = http.createServer( (req, res) => {
    unifiedServer(req, res);   
});

// Start HTTP server
httpServer.listen(config.httpPort, () => console.log('Server is listening on port '+ config.httpPort));

// Instantiating HTTPS server
const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});

// Start HTTPS server
httpsServer.listen(config.httpsPort, () => console.log('Server is listening on port '+ config.httpsPort));


// All server logic for both https and http
const unifiedServer = (req, res) => {
    // Get URL and parse it. parsedUrl is an object
    const parsedUrl = url.parse(req.url, true); //true tell URL to throw its query-string operations through d query-string module of node so that d query string that comes back here is treated same as though we call the query-string ourself
    
    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, ''); //regex replace leading & ending / with an empty string
    
    // Get the query string as an object
    const queryStringObject = parsedUrl.query;
    
    // Get the HTTP method
    const method = req.method.toUpperCase();
    
    // Get the headers as object
    const headers = req.headers;
    
    // Get payload, if any: (using string_decoder inbuilt module)
    /**We read incoming payload in streams(pieces). As d data is streaming in, d REQ object emits d DATA event 
     * anytime it receives a little piece, & it sends a bunch of undecoded data which we recieve as ARG to the callback
     * then we decode it to UTF8 using the UTF8 decoded that we instantiated, since we know it should be UTF8   */
    const decoder = new StringDecoder('utf-8'); //arg tell StringDecoder d kind of string you want to decode.
    var buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();    //buffer is appended with anything d req end it with
    
        
        // Choose the handler this request should go to. If one is not found, invoke the notFound handler
        /**We checked if trimmedPath of a request matches any key in the router object */
        const choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
    
        // Construct data object to send to the handler
        const data = {
            trimmedPath,
            headers,
            path,
            method,
            queryStringObject,
            payload: buffer
        };
    
        // Route the request to the handler specfied in the router
        choosenHandler(data, (statusCode, payload) => {
            /** Use d status code called back by d handler or default to 200
             * if it is a type of number, then use it, else use 200
             */
            typeof(statusCode) === 'number' ? statusCode : 200;
            
            /**Use the payload defined by the handler or default, to and empty object
             * If payload we are sending back as response has a type of object then we use that payload, 
             * else we use an empty object
             */
            typeof(payload) === 'object'? payload : {};
            const payloadString = JSON.stringify(payload);
            
            // Send the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
            
            // Log the request path
            console.log('Returning this response', statusCode, payloadString);
        });
    
    });
    
}

const handlers = {};

handlers.ping = (data, callback) => {
    // 
    callback(200);
}

handlers.notFound = (data, callback) => {
    callback(404);
}

// Define requests router
const router = {
    'ping': handlers.ping
};