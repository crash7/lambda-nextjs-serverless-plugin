const { execSync, execFileSync } = require("child_process");
const { S3 } = require("aws-sdk");

class LambdaNextjsPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      "before:package:initialize": this.beforePackage.bind(this),
      "before:deploy:deploy": this.uploadFilesToS3.bind(this),
      "after:deploy:deploy": this.uploadFilesToS3.bind(this),
      "before:offline:start:init": this.beforeOfflineStart.bind(this),
    };

    this.s3Client = new S3();
  }

  log(message, ...others) {
    console.info(`Next.js FO: ${message}`, ...others);
  }

  beforeOfflineStart() {
    this.beforePackage();
  }

  beforePackage() {
    this.log("Building next app");
    execSync("node_modules/.bin/next build", { stdio: "inherit" });
    this.log("Building page handler");
    execFileSync(`${__dirname}/build-bridge.js`, { stdio: "inherit" });
  }

  async uploadFilesToS3() {
    const bucket =
      this.serverless.service.resources.Resources.StaticFilesBucket.Properties
        .BucketName;

    try {
      await this.s3Client
        .getBucketAcl({
          Bucket: bucket,
        })
        .promise();

      const profile = this.serverless.service.provider.profile;
      execSync(
        `aws s3 sync .next/static s3://${bucket}/_next/static ${
          profile ? `--profile ${profile}` : ""
        }`,
        {
          stdio: "inherit",
        }
      );
      execSync(
        `aws s3 sync public s3://${bucket}/public ${
          profile ? `--profile ${profile}` : ""
        }`,
        {
          stdio: "inherit",
        }
      );
    } catch (error) {
      this.log("Bucket not available");
    }
  }
}

module.exports = LambdaNextjsPlugin;
