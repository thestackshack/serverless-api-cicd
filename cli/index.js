'use strict';
var prompt = require('prompt');
var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var archiver = require('archiver');

var AWS = require('aws-sdk');
var s3;
var cloudformation;
var lambda;

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

var getBuildsFile = function(bucket, branch, callback) {
    var params = {
        Bucket: bucket,
        Key: branch+'/builds.json'
    };
    s3.getObject(params, callback);
};

var show = function(branch) {
    fs.readFile(__dirname + '/.stackdata', function (err, data) {
        if (err) {
            throw err;
        }
        var stackdata = JSON.parse(data);
        getBuildsFile(stackdata.artifactBucket, branch, function(err, dataObj) {
            if (err) throw err;
            var data = JSON.parse(dataObj.Body);
            console.log(JSON.stringify(data, null, 3));
        });
    });
};

var deploy = function(branch, version) {
    fs.readFile(__dirname + '/.stackdata', function (err, data) {
        if (err) {
            throw err;
        }
        var stackdata = JSON.parse(data);
        // Execute deployer lambda
        var event = {
            branch: branch,
            version: version,
            artifactBucket: stackdata.artifactBucket,
            lambda: stackdata.APIFunction
        };
        var params = {
            FunctionName: stackdata.DeployFunction, /* required */
            InvocationType: 'RequestResponse',
            LogType: 'Tail',
            Payload: JSON.stringify(event)
        };
        lambda.invoke(params, function(err, data) {
            if (err) throw err;
            if (_.isEqual(data.StatusCode, 200) && JSON.parse(data.Payload).success)
                console.log('version '+version+' deployed.');
            else {
                console.log('Failed to deploy.');
                console.log(JSON.stringify(data, null, 3));
            }
        });
    });
};

var stackup = function(ProjectName, GitHubOwner, GitHubRepo, GitHubToken) {
    var bucket = ProjectName+'-build-artifacts';
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
                StackName: ProjectName, /* required */
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
                        ParameterValue: ProjectName,
                        UsePreviousValue: true
                    },
                    {
                        ParameterKey: 'GitHubOwner',
                        ParameterValue: GitHubOwner,
                        UsePreviousValue: true
                    },
                    {
                        ParameterKey: 'GitHubRepo',
                        ParameterValue: GitHubRepo,
                        UsePreviousValue: true
                    },
                    {
                        ParameterKey: 'GitHubToken',
                        ParameterValue: GitHubToken,
                        UsePreviousValue: true
                    }
                ],
                Tags: [
                    {
                        Key: 'App', /* required */
                        Value: ProjectName /* required */
                    }
                ],
                TemplateURL: data
            };
            cloudformation.createStack(params, next);
        },
        function (data, next) {
            //
            // Create the stack.
            //
            var params = {
                StackName: ProjectName
            };
            cloudformation.waitFor('stackCreateComplete', params, next);
        },
        function (data, next) {
            //
            // Store the stack name
            //
            if (_.includes(['UPDATE_COMPLETE', 'CREATE_COMPLETE'], data.Stacks[0].StackStatus)) {
                var stackData = {
                    artifactBucket: bucket,
                    DeployFunction: _.find(data.Stacks[0].Outputs, {OutputKey: 'DeployFunction'}).OutputValue,
                    ShowFunction: _.find(data.Stacks[0].Outputs, {OutputKey: 'ShowFunction'}).OutputValue,
                    ServiceEndpointProd: _.find(data.Stacks[0].Outputs, {OutputKey: 'ServiceEndpointProd'}).OutputValue,
                    ServiceEndpointDev: _.find(data.Stacks[0].Outputs, {OutputKey: 'ServiceEndpointDev'}).OutputValue,
                    APIFunction: _.find(data.Stacks[0].Outputs, {OutputKey: 'APIFunction'}).OutputValue
                };
                fs.writeFile(__dirname + '/.stackdata', JSON.stringify(stackData, null, 3), function(err) {
                    if(err) {
                        next(err, null);
                    }

                    next(null, stackData);
                });

            } else
                next(data.Stacks[0].StackStatusReason, data);
        }
    ], function(err, results) {
        if (err) console.log(err);
        console.log('Done!');
        console.log('Prod API Endpoint: '+results.ServiceEndpointProd);
        console.log('Dev API Endpoint: '+results.ServiceEndpointDev);
    });
};

var args = require('yargs')
    .usage('npm run deployer -- <cmd> [args]')
    .command('stackup [ProjectName] [GitHubOwner] [GitHubRepo] [GitHubToken] [profile]', 'Deploy the stack.', {
        ProjectName: {
            describe: 'Please enter a name for your project.  This will be the CloudFormation stack name and used as a prefix for many of the resources.',
            required: true
        },
        GitHubOwner: {
            describe: 'Your github username or organization name.',
            required: true
        },
        GitHubRepo: {
            describe: 'Your github repo name.',
            required: true
        },
        GitHubToken: {
            describe: 'Your github personal access token.  https://github.com/settings/tokens, needs "repo" and "admin:repo_hook" checked.',
            required: true
        },
        profile: {
            describe: 'Your AWS credentials profile.'
        }
    }, function (argv) {
        if (argv.profile) {
            console.log('setting AWS profile: '+argv.profile);
            var credentials = new AWS.SharedIniFileCredentials({profile: argv.profile});
            AWS.config.credentials = credentials;
        }
        s3 = new AWS.S3();
        cloudformation = new AWS.CloudFormation();
        lambda = new AWS.Lambda();
        stackup(argv.ProjectName, argv.GitHubOwner, argv.GitHubRepo, argv.GitHubToken);
    })
    .command('deploy [branch] [version] [profile]', 'Deploy a new version of the api.', {
        branch: {
            describe: 'branch.  [master | develop]',
            required: true
        },
        version: {
            describe: 'The version that has been built.',
            required: true
        },
        profile: {
            describe: 'Your AWS credentials profile.'
        }
    }, function (argv) {
        if (argv.profile) {
            console.log('setting AWS profile: '+argv.profile);
            var credentials = new AWS.SharedIniFileCredentials({profile: argv.profile});
            AWS.config.credentials = credentials;
        }
        s3 = new AWS.S3();
        cloudformation = new AWS.CloudFormation();
        lambda = new AWS.Lambda();
        deploy(argv.branch, argv.version);
    })
    .command('show [branch] [profile]', 'Show deployment history, currently deployed version, and built versions.', {
        branch: {
            describe: 'branch.  [master | develop]',
            required: true
        },
        profile: {
            describe: 'Your AWS credentials profile.'
        }
    }, function (argv) {
        if (argv.profile) {
            console.log('setting AWS profile: '+argv.profile);
            var credentials = new AWS.SharedIniFileCredentials({profile: argv.profile});
            AWS.config.credentials = credentials;
        }
        s3 = new AWS.S3();
        cloudformation = new AWS.CloudFormation();
        lambda = new AWS.Lambda();
        show(argv.branch);
    })
    .help()
    .argv;
