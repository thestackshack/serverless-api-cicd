'use strict';
var prompt = require('prompt');
var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var archiver = require('archiver');

var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials({profile: 'bluefin'});
AWS.config.credentials = credentials;
var s3 = new AWS.S3();
var cloudformation = new AWS.CloudFormation();

var uploadCFTemplate = function(path, bucket, next) {

    fs.readFile(path, function (err, data) {
        if (err) {
            throw err;
        }

        var base64data = new Buffer(data, 'binary');
        var params = {
            Body: base64data,
            Bucket: bucket,
            Key: 'cloudformation.yml'
        };
        s3.putObject(params, function(err, result) {
            if (err) {
                throw err;
            }
            next(err, 'https://s3.amazonaws.com/'+bucket+'/cloudformation.yml');
        });
    });
};

var zipUploadDelete = function(path, filename, bucket, next) {
    var output = fs.createWriteStream(__dirname + path + filename + '.zip');
    var archive = archiver('zip');

    output.on('close', function () {
        //
        // Upload to S3
        //
        fs.readFile(__dirname + path + filename + '.zip', function (err, data) {
            if (err) {
                throw err;
            }

            var base64data = new Buffer(data, 'binary');
            var params = {
                Body: base64data,
                Bucket: bucket,
                Key: filename + '.zip'
            };
            s3.putObject(params, function(err, result) {
                if (err) {
                    throw err;
                }
                //
                // Delete file
                //
                fs.unlink(__dirname + path + filename + '.zip', function(err, data) {
                    if (err) {
                        throw err;
                    }
                    next(err, null);
                });
            });
        });
    });

    archive.on('error', function(err){
        console.log(err);
        throw err;
    });

    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
            // log warning
            console.log(err);
        } else {
            // throw error
            throw err;
        }
    });

    archive.pipe(output);
    var file1 = __dirname + path + filename;
    archive.append(fs.createReadStream(file1), { name: filename });
    archive.finalize();
};

var stackup = function() {

    //
    // Start the prompt
    //
    prompt.start();

    //
    // Get two properties from the user: username and email
    //
    var schema = {
        properties: {
            ProjectName: {
                description: 'Please enter a name for your project.  This will be the CloudFormation stack name and used as a prefix for many of the resources.',
                pattern: /^[a-zA-Z0-9-]+$/,
                message: 'Name must be only letters, numbers, or dashes',
                required: true
            },
            GitHubOwner: {
                description: 'Your github username or organization name.',
                required: true
            },
            GitHubRepo: {
                description: 'Your github repo name.',
                required: true
            },
            GitHubToken: {
                description: 'Your github personal access token.  https://github.com/settings/tokens, needs "repo" and "admin:repo_hook" checked.',
                required: true
            }
        }
    };
    prompt.get(schema, function (err, inputs) {
        if (err) {
            console.log('Invalid inputs.');
            process.exit(0);
        }
        var bucket = inputs.ProjectName+'-build-artifacts';
        async.waterfall([
            function(next) {
                //
                // Create the S3 bucket to upload the lambda's to.
                //
                console.log('Creating S3 artifacts bucket.');
                var params = {
                    Bucket: bucket
                };
                s3.createBucket(params, next);
            },
            function(data, next) {
                //
                // Zip and upload the api/index, infrastructure/deploy.js, and infrastructure/package.js
                //
                console.log('upload index.js lambda to S3');
                zipUploadDelete('/../api/', 'index.js', bucket, next);
            },
            function(data, next) {
                //
                // Zip and upload the api/index, infrastructure/deploy.js, and infrastructure/package.js
                //
                console.log('upload deploy.js lambda to S3');
                zipUploadDelete('/../infrastructure/', 'deploy.js', bucket, next);
            },
            function(data, next) {
                //
                // Zip and upload the api/index, infrastructure/deploy.js, and infrastructure/package.js
                //
                console.log('upload package.js lambda to S3');
                zipUploadDelete('/../infrastructure/', 'package.js', bucket, next);
            },
            function(data, next) {
                console.log('Upload CF template to S3');
                uploadCFTemplate(__dirname + '/../infrastructure/cloudformation.yml', bucket, next);
            },
            function(data, next) {
                console.log('Creating stack');
                var params = {
                    StackName: inputs.ProjectName, /* required */
                    Capabilities: [
                        'CAPABILITY_IAM'
                    ],
                    OnFailure: 'DO_NOTHING',
                    Parameters: [
                        {
                            ParameterKey: 'ArtifactsBucket',
                            ParameterValue: bucket,
                            UsePreviousValue: true
                        },
                        {
                            ParameterKey: 'ProjectName',
                            ParameterValue: inputs.ProjectName,
                            UsePreviousValue: true
                        },
                        {
                            ParameterKey: 'GitHubOwner',
                            ParameterValue: inputs.GitHubOwner,
                            UsePreviousValue: true
                        },
                        {
                            ParameterKey: 'GitHubRepo',
                            ParameterValue: inputs.GitHubRepo,
                            UsePreviousValue: true
                        },
                        {
                            ParameterKey: 'GitHubToken',
                            ParameterValue: inputs.GitHubToken,
                            UsePreviousValue: true
                        }
                    ],
                    Tags: [
                        {
                            Key: 'App', /* required */
                            Value: inputs.ProjectName /* required */
                        }
                    ],
                    TemplateURL: data
                };
                cloudformation.createStack(params, next);
            },
            function (data, next) {
                var params = {
                    StackName: inputs.ProjectName
                };
                cloudformation.waitFor('stackExists', params, next);
            }
        ], function(err, results) {
            if (err) console.log(err);
            console.log('Done!');
        });
    });
};

var usage = function() {
    console.log('Usage: npm run deployer -- <command>.  command = [help, stackup, show, deploy]');
    console.log('');
    console.log('stackup - Deploy the stack to AWS after you\'ve created your repo and pushed to the \'master\' branch.');
    console.log('show - Show the version information about the api.  \'npm run deployer -- show <branch>\'.  branch = [master | develop]');
    console.log('deploy - Deploy the built version to the api.  \'npm run deployer -- deploy <branch> <version>.  branch = [master | develop]');
    console.log('');
};

if (_.size(process.argv) < 3 ||
    !_.includes(['help', 'stackup', 'show', 'deploy'], process.argv[2]) ||
    _.isEqual(process.argv[2], 'help')) {
    usage();
} else {
    var command = process.argv[2];
    if (_.isEqual(command, 'stackup')) {
        stackup();
    }
}


