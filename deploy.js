'use strict';

var AWS = require('aws-sdk');
var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});

exports.handler = function(event, context, callback) {

    // Create a new Lambda Version
    var updateFunctionCode = function(next) {
        console.log('updateFunctionCode');
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
    var updateAlias = function(version, next) {
        console.log('updateAlias');
        var params = {
            FunctionName: '${APIFunction}', /* required */
            FunctionVersion: version,
            Name: event.branch === 'master' ? 'PROD' : 'DEV'
        };
        console.log(JSON.stringify(params));
        lambda.updateAlias(params, next);
    };

    // Delete the old version
    var deleteOldVersions = function(next) {
        console.log('deleteOldVersions');
        var params = {
            FunctionName: '${APIFunction}', /* required */
            MaxItems: 10
        };
        console.log(JSON.stringify(params));
        lambda.listAliases(params, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response
            var versionsInUse = [];
            for (var i = 0 ; i < data.Aliases.length ; i++) {
                versionsInUse.push(data.Aliases[i].FunctionVersion);
            }
            var params = {
                FunctionName: '${APIFunction}', /* required */
                MaxItems: 10
            };
            lambda.listVersionsByFunction(params, function(err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
                var deleteErr = null;
                var loopDelete = function(i) {
                    if( i < data.Versions.length ) {
                        if (versionsInUse.indexOf(data.Versions[i].Version) === -1) {
                            console.log('deleteOldVersion');
                            var params = {
                                FunctionName: '${APIFunction}', /* required */
                                Qualifier: data.Versions[i].Version
                            };
                            console.log(JSON.stringify(params));
                            lambda.deleteFunction(params, function(err, data) {
                                if (err) console.log(err, err.stack); // an error occurred
                                else     console.log(data);           // successful response
                                deleteErr = err;
                                if (!err)
                                    loopDelete(i+1);
                            });
                        } else {
                            loopDelete(i+1);
                        }
                    }
                };
                loopDelete(0);
                next(deleteErr);
            });
        });
    };

    // Update the builds.json history



    updateFunctionCode(function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response

        updateAlias(data.Version, function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else     console.log(data);           // successful response

            deleteOldVersions(function(err) {
                if (err) console.log(err, err.stack); // an error occurred

                const response = {
                    status: 'complete'
                };

                callback(null, response);
            });
        });
    });
};