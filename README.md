# Serverless API with CI/CD
The template: [cloudformation.yml](infrastructure/cloudformation.yml)

Quickly deploy an API (API Gateway + Lambda) with _/prod_ and _/dev_ endpoints.  Each can be running a different version of the Lambda function.

Built in CI/CD using CodePipeline & CodeBuild which pulls from your GitHub repo.  Just push your changes to either the develop or master branch and a new version of the Lambda is tested and built.

Use the command line tools to quickly deploy a new version to either the dev or prod endpoints.

## What AWS resources does this template use?
* Lambda (API Function, Github webhook for CI/CD)
* API Gateway (HTTP proxy to Lambda)
* S3 (Lambda files)
* CodeBuild (Continuous integration & deployment)
* CodePipeline (Continuous integration & deployment)
* CloudFormation (Infrastructure as Code)
* IAM (AWS permissions & users)

## Usage
Usage: `npm run deployer -- <command>`.  command = [help, stackup, show, deploy]

### stackup
Run this command one time to build the stack.

```
npm run deployer -- stackup \
--ProjectName=<project_name> \
--GitHubOwner=<user_or_organization> \
--GitHubRepo=<repo> \
--GitHubToken=<token> \
--profile=<aws_profile>
```

**ProjectName**:  Please enter a name for your project.  This will be the
                 CloudFormation stack name and used as a prefix for many of the
                 resources.

**GitHubOwner**:  Your github username or organization name.

**GitHubRepo**:   Your github repo name.

**GitHubToken**:  Your github personal access token.
                 https://github.com/settings/tokens, needs "repo" and
                 "admin:repo_hook" checked.

**profile**:      Your AWS credentials profile. [optional]

### deploy
Run this command to deploy a new version to either the */prod* or */dev* endpoint.

```
npm run deployer -- deploy \
--branch=<master> \
--version=<1> \
--profile=<aws_profile>
```

**branch**:   Deploy to prod or dev.  [master | develop]

**version**:   Which built version to deploy?

**profile**:      Your AWS credentials profile. [optional]

### show
Run this command to see what versions have been built and which version is currently running.  The deployment history is also available.

```
npm run deployer -- show \
--branch=<master> \
--profile=<aws_profile>
```

**branch**:   Which environment? prod or dev.  [master | develop]

**profile**:      Your AWS credentials profile. [optional]
