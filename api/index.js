'use strict';

exports.handler = function(event, context, callback) {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: `Hello, the current time is ${new Date().toTimeString()}.  The current version is 6.`,
            event: event
        })
    };

    callback(null, response);
};