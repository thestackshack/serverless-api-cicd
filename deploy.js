'use strict';

var AWS = require('aws-sdk');
var lambda = new AWS.Lambda({apiVersion: '2015-03-31'});
var s3 = new AWS.S3();

// Get the builds.json file.
var getBuildsFile = function(bucket, branch, next) {
    console.log('getBuildsFile');
    var params = {
        Bucket: bucket,
        Key: branch+'/builds.json'
    };
    console.log(JSON.stringify(params));
    s3.getObject(params, next);
};

var success = function(data) {
    const response = {
        success: true,
        data: data
    };
    callback(null, response);
};

var failure = function(err) {
    console.log(err);
    const response = {
        success: false,
        err: err
    };
    callback(null, response);
};

exports.show = function(event, context, callback) {
    getBuildsFile(bucket, branch, function(err, dataObj) {
        if (err) return failure(err);
        else return success(JSON.parse(dataObj.Body));
    });
};

exports.deploy = function(event, context, callback) {

    // Create a new Lambda Version
    var updateFunctionCode = function(next) {
        console.log('updateFunctionCode');
        var params = {
            FunctionName: event.lambda, /* required */
            DryRun: false,
            Publish: true,
            S3Bucket: event.artifactBucket,
            S3Key: event.branch+'/'+event.version
        };
        console.log(JSON.stringify(params));
        lambda.updateFunctionCode(params, next);
    };

    // Point the alias to the new version
    var updateAlias = function(version, next) {
        console.log('updateAlias');
        var params = {
            FunctionName: event.lambda, /* required */
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
            FunctionName: event.lambda, /* required */
            MaxItems: 10
        };
        console.log(JSON.stringify(params));
        lambda.listAliases(params, function(err, data) {
            if (err) return next(err); // an error occurred
            var versionsInUse = [];
            for (var i = 0 ; i < data.Aliases.length ; i++) {
                versionsInUse.push(data.Aliases[i].FunctionVersion);
            }
            var params = {
                FunctionName: event.lambda, /* required */
                MaxItems: 10
            };
            lambda.listVersionsByFunction(params, function(err, data) {
                if (err) return next(err); // an error occurred
                var deleteErr = null;
                var loopDelete = function(i) {
                    if( i < data.Versions.length ) {
                        if (versionsInUse.indexOf(data.Versions[i].Version) === -1) {
                            console.log('deleteOldVersion');
                            var params = {
                                FunctionName: event.lambda, /* required */
                                Qualifier: data.Versions[i].Version
                            };
                            console.log(JSON.stringify(params));
                            lambda.deleteFunction(params, function(err, data) {
                                if (err) return next(err); // an error occurred
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

    // Put the builds.json file.
    var putBuildsFile = function(bucket, branch, data, next) {
        console.log('putBuildsFile');
        var params = {
            Body: JSON.stringify(data),
            Bucket: bucket,
            Key: branch+'/builds.json',
            ContentType: 'application/json'
        };
        console.log(JSON.stringify(params));
        s3.putObject(params, next);
    };

    var updateBuildsFile = function(bucket, branch, version, next) {
        getBuildsFile(bucket, branch, function(err, dataObj) {
            if (err) return next(err);
            else {
                var data = JSON.parse(dataObj.Body);
                if (!data.history) {
                    data.history = [];
                }
                data.history.push({
                    version: version,
                    date: new Date()
                });
                data.current_version = version;
                putBuildsFile(bucket, branch, data, function(err, results) {
                    next(err);
                });
            }
        });
    };

    updateFunctionCode(function(err, data) {
        if (err) return failure(err);

        updateAlias(data.Version, function(err, data) {
            if (err) return failure(err);

            deleteOldVersions(function(err) {
                if (err) return failure(err);

                updateBuildsFile(event.artifactBucket, event.branch, event.version, function(err) {
                    if (err) return failure(err);
                    success(null);
                });
            });
        });
    });
};