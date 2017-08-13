'use strict';

exports.handler = (event, context, callback) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify({
            message: `Hello, the current time is ${new Date().toTimeString()}.`,
            event: event
        })
    };

    callback(null, response);
};