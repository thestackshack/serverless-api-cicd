'use strict';

var AWS = require('aws-sdk');

exports.handler = function(event, context) {

    console.log(JSON.stringify(event));

    var codepipeline = new AWS.CodePipeline();
    var s3 = new AWS.S3();

    // Retrieve the Job ID from the Lambda action
    var jobId = event["CodePipeline.job"].id;

    if (event["CodePipeline.job"].data.inputArtifacts[0].revision) {
        var SourceOutput = event["CodePipeline.job"].data.inputArtifacts[0];
        var BuildOutput = event["CodePipeline.job"].data.inputArtifacts[1];
    } else {
        var SourceOutput = event["CodePipeline.job"].data.inputArtifacts[1];
        var BuildOutput = event["CodePipeline.job"].data.inputArtifacts[0];
    }
    var bucket = BuildOutput.location.s3Location.bucketName;
    var key = BuildOutput.location.s3Location.objectKey;
    var branch = event["CodePipeline.job"].data.actionConfiguration.configuration.UserParameters;

    var commit = SourceOutput.revision;

    // Get the builds.json file.
    var getBuildsFile = function(bucket, branch, callback) {
        console.log('getBuildsFile');
        var params = {
            Bucket: bucket,
            Key: branch+'/builds.json'
        };
        console.log(JSON.stringify(params));
        s3.getObject(params, callback);
    };

    // Put the builds.json file.
    var putBuildsFile = function(bucket, branch, data, callback) {
        console.log('putBuildsFile');
        var params = {
            Body: JSON.stringify(data),
            Bucket: bucket,
            Key: branch+'/builds.json',
            ContentType: 'application/json'
        };
        console.log(JSON.stringify(params));
        s3.putObject(params, callback);
    };

    // Copy the artifact
    var copyBuildArtifact = function(bucket, key, branch, version, callback) {
        console.log('copyBuildArtifact');
        var params = {
            Bucket: bucket,
            CopySource: '/'+bucket+'/'+key,
            Key: branch+'/'+version
        };
        console.log(JSON.stringify(params));
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
    getBuildsFile(bucket, branch, function(err, dataObj) {
        if (err && err.code === 'NoSuchKey') {
            var data = {
                versions:[{
                    version: 1,
                    date: new Date(),
                    commit: commit
                }],
                max_version: {
                    version: 1,
                    date: new Date(),
                    commit: commit
                }
            };
        } else if (err) {
            return putJobFailure(err);
        } else {
            var data = JSON.parse(dataObj.Body);
            data.versions.push({
                version: data.max_version.version+1,
                date: new Date(),
                commit: commit
            });
            data.max_version = {
                version: data.max_version.version+1,
                date: new Date(),
                commit: commit
            };
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