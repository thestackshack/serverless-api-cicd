'use strict';

var AWS = require('aws-sdk');

exports.handler = function(event, context) {

    console.log(JSON.stringify(event, null, 3));
    console.log(JSON.stringify(event));

    var codepipeline = new AWS.CodePipeline();
    var s3 = new AWS.S3();

    // Retrieve the Job ID from the Lambda action
    var jobId = event["CodePipeline.job"].id;

    var bucket = event["CodePipeline.job"].data.inputArtifacts[0].location.s3Location.bucketName;
    var key = event["CodePipeline.job"].data.inputArtifacts[0].location.s3Location.objectKey;
    var branch = event["CodePipeline.job"].data.actionConfiguration.configuration.UserParameters;

    // Get the builds.json file.
    var getBuildsFile = function(bucket, branch, callback) {
        var params = {
            Bucket: bucket,
            Key: branch+'/builds.json'
        };
        s3.getObject(params, callback);
    };

    // Put the builds.json file.
    var putBuildsFile = function(bucket, branch, data, callback) {
        var params = {
            Body: data,
            Bucket: bucket,
            Key: branch+'/builds.json'
        };
        s3.putObject(params, callback);
    };

    // Copy the artifact
    var copyBuildArtifact = function(bucket, key, branch, version, callback) {
        var params = {
            Bucket: bucket,
            CopySource: key,
            Key: branch+'/'+version
        };
        s3.copyObject(params, callback);
    };

    // Notify AWS CodePipeline of a successful job
    var putJobSuccess = function(message) {
        var params = {
            jobId: jobId
        };
        codepipeline.putJobSuccessResult(params, function(err, data) {
            if(err) {
                context.fail(err);
            } else {
                context.succeed(message);
            }
        });
    };

    // Notify AWS CodePipeline of a failed job
    var putJobFailure = function(message) {
        var params = {
            jobId: jobId,
            failureDetails: {
                message: JSON.stringify(message),
                type: 'JobFailed',
                externalExecutionId: context.invokeid
            }
        };
        codepipeline.putJobFailureResult(params, function(err, data) {
            context.fail(message);
        });
    };

    // Fetch the builds.json
    getBuildsFile(bucket, branch, function(err, data) {
        if (err && err.code === 'NotFound') {
            data = {
                versions:[1],
                max_version: 1
            };
        } else if (err) {
            return putJobFailure(err);
        } else {
            data.versions.push(data.max_version+1);
            data.max_version += 1;
        }

        copyBuildArtifact(bucket, key, branch, data.max_version, function(err, results) {
            if (err) {
                return putJobFailure(err);
            } else {
                putBuildsFile(bucket, branch, data, function(err, results) {
                    if (err) {
                        return putJobFailure(err);
                    } else {
                        // Succeed the job
                        putJobSuccess("Packaged successfully. version:"+data.max_version);
                    }
                });
            }
        });
    });
};