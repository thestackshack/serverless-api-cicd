# Serverless API with CI/CD
The template: [cloudformation.yml](cloudformation.yml)

** This is a work in progress.  Still working on the CI/CD Github integration.

## What AWS resources does this template use?
* Lambda (API Function, Github webhook for CI/CD)
* API Gateway (HTTP proxy to Lambda)
* S3 (Lambda files)
* CodeBuild (Continuous integration & deployment)
* CodePipeline (Continuous integration & deployment)
* CloudFormation (Infrastructure as Code)
* IAM (AWS permissions & users)

## Create Stack
```
aws cloudformation create-stack \
--stack-name serverless-stack \
--template-body file:///<your-path>/cloudformation.yml \
--tags=Key=app,Value=serverless-stack \
--capabilities CAPABILITY_IAM \
--parameters file:///<your-path>/params.json \
--profile bluefin
```

aws cloudformation create-stack \
--stack-name serverless-stack \
--template-body file:///Users/findleyr/Documents/code/thestackshack/serverless-api-cicd/cloudformation.yml \
--tags=Key=app,Value=serverless-stack \
--capabilities CAPABILITY_IAM \
--parameters file:///Users/findleyr/Documents/code/thestackshack/serverless-api-cicd/.params.json \
--profile bluefin

### Pipeline to update stack and deploy lambda
https://github.com/milancermak/lambda-pipeline/tree/master/infrastructure
https://github.com/wjordan/aws-codepipeline-nested-stack/blob/master/cfn-template.yml

## CLI
- Collect params.
- Zip and upload deploy.js
- Execute CF create stack
- Deploy...
- Show...