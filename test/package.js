
var assert = require('assert');
var winston = require('winston');
var _ = require('lodash');
var package = require('../package');

var event = {
    "CodePipeline.job": {
        "id": "9d036618-35da-4478-a575-b3c920ebfd81",
        "accountId": "132093761664",
        "data": {
            "actionConfiguration": {
                "configuration": {
                    "FunctionName": "serverless-stack-PackageFunction-CU9GMTX8LHNU"
                }
            },
            "inputArtifacts": [
                {
                    "location": {
                        "s3Location": {
                            "bucketName": "serverless-api-cicd-build-artifacts",
                            "objectKey": "serverless-api-cicd/BuildOutpu/s2Sp1f1"
                        },
                        "type": "S3"
                    },
                    "revision": null,
                    "name": "BuildOutput"
                }
            ],
            "outputArtifacts": [],
            "artifactCredentials": {
                "secretAccessKey": "5gJHbbCuRrsIvXsQ77/9m2CHhrdCtF029PYNwJrq",
                "sessionToken": "AgoGb3JpZ2luEF8aCXVzLWVhc3QtMSKAAhOO9iXtA+0eCE4XsxgdrG2igumHf5k0lH5bu/4Tb/gptLUkQCmWwFDXD1GtykbihORGGcEoe2/VuBeCWVmoSITdscWSr8c6QuGobAbfIj6JvLuxNKTshyyRM3F9Ml8slSkv2jRqKPPeiInQWrhTqX/l11v6PWn26YgiVM41KZcv/PGIE42zZYfV7j7s5hhXzsxlJMnrlZUj6SnNzOHnz/a16xDp+Vrxq2eN1C7sHOJLBhg1ej6SHxQg1G3k4aK4oEaL3FqU4l86ZVU2+v1SAzEQtakP712mA1KG/rtMsay6gm1I3QTlOtQp7xXYBJbIGSQBehYLiq+cyGneXMHDJeQqjQUIFBABGgwxMzIwOTM3NjE2NjQiDERkPPuh+SmjWEb1OCrqBFfzo9WV7u5RTRKWUGF2z0GY26LJb5l9BRGUOWAnUq8qoBE2vvrQA/P2NmHUbJ+E/z3sVGsa+ruxCk5udxZ4VpdcoALp3rfpO9tq7R0gsVIUH3oWUqujE/WL1t4y8k8mVR0x+x8v8gfeBbGu9gm3sfFroTVAHjINaaeHtkz0B/5PkSc1NSdQX8xfNE3ZNZvWCQPsae8h9vIb1DinB+gjr48nZygPDDzOjITtPmPLPFbHhcWmsGx0jU/QDsCBi3ht1khhh26LoTXYAl1h7/kQn4ZLg3cLjZPSKuMSx3f+c8KaJVUjfFxwKouWQGGXNgMCFzyB8XH0qZXytxMQ9N4oMX3IwLn+piTHENwcjNm7Q1o6v+U4gAcKfULa+Agg1+BjGo1Fs0qOnezCl86weUYXYKtqUn55dtInlfFJGpmHzxCatDyhyV0sgitC5gNnSermL+PRHue0GQ9yu8QF8OIiHG1UqQiHkr5L8goKDNYOaxRdede25e21k9cF0b6+bQWrvyz9fALjvHbCB1hd9j46u5Sp+/to1lHpB93+WZjI3OdadZ6u2Cemf7dok2YLw9caATJKQhDVr2dqbKAyHs9HrtrLyAGCvhBk+tki2EAkErHGZOex0Ar3CWmkdoJRHBL36y5VNRz8uWTyrxDdjzTg2XoroPv4EPsQW47vXl0vnm7y+Kb/V3mkb+lhD5iCPna1P1kf4+py9db9apDmxkkICMeaTYygf/7YjTMNbQJYF2cvXyDlQXzdbjgKdW3hJju6pOs4iYyXET3RBSDMo5Xzij24FYjd0LXtgUZt1QLa9nE4xUK3J9xL+C9pzjDzhMbMBQ==",
                "accessKeyId": "ASIAJZL3AWSS3YC7536Q"
            }
        }
    }
};

describe('package', function() {
    it('main', function (done) {
        done();
        // package.handler(event, {}, function(err, response) {
        //     assert.equal(response.statusCode, 200);
        //     assert.ok(response.body);
        //     var body = JSON.parse(response.body);
        //     assert.ok(body.event);
        //     assert.ok(body.event.test);
        //     winston.info(JSON.stringify(response, null, 3));
        //     done();
        // });
    });
});