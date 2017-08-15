# Serverless API with CI/CD
The template: [cloudformation.yml](infrastructure/cloudformation.yml)

** This is a work in progress.  Still working on the CI/CD Github integration.

## What AWS resources does this template use?
* Lambda (API Function, Github webhook for CI/CD)
* API Gateway (HTTP proxy to Lambda)
* S3 (Lambda files)
* CodeBuild (Continuous integration & deployment)
* CodePipeline (Continuous integration & deployment)
* CloudFormation (Infrastructure as Code)
* IAM (AWS permissions & users)

## Usage
Usage: npm run deployer -- <command>.  command = [help, stackup, show, deploy]

* stackup - Deploy the stack to AWS after you've created your repo and pushed to the 'master' branch.
* show - Show the version information about the api.  'npm run deployer -- show <branch>'.  branch = [master | develop]
* deploy - Deploy the built version to the api.  'npm run deployer -- deploy <branch> <version>.  branch = [master | develop]
