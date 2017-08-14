'use strict';

var AWS = require('aws-sdk');
var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});

exports.handler = function(event, context, callback) {

    // Create a new Lambda Version
    var updateFunctionCode = function(next) {
        var params = {
            FunctionName: '${APIFunction}', /* required */
            DryRun: false,
            Publish: true,
            S3Bucket: '${ArtifactsBucket}',
            S3Key: event.branch+'/'+event.version,
            S3ObjectVersion: '1'
        };
        console.log(JSON.stringify(params));
        lambda.updateFunctionCode(params, next);
    };

    // Point the alias to the new version

    // Delete the old version

    // Update the builds.json history



    updateFunctionCode(function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response

        const response = {
            status: 'complete'
        };

        callback(null, response);
    });
};