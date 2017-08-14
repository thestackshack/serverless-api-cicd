'use strict';

var AWS = require('aws-sdk');

exports.handler = function(event, context) {

    console.log(JSON.stringify(event, null, 3));
    console.log(JSON.stringify(event));

    var codepipeline = new AWS.CodePipeline();

    // Retrieve the Job ID from the Lambda action
    var jobId = event["CodePipeline.job"].id;

    var bucket = event["CodePipeline.job"].data.inputArtifacts[0].location.s3Location.bucketName;
    var key = event["CodePipeline.job"].data.inputArtifacts[0].location.s3Location.objectKey;

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

    // Succeed the job
    putJobSuccess("Packaged successfully.");
};