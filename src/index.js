const { execSync, execFileSync } = require("child_process");

class LambdaNextjsPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      "before:package:initialize": this.beforePackage.bind(this),
      "before:offline:start:init": this.beforeOfflineStart.bind(this),
      "after:deploy:deploy": this.afterDeploy.bind(this),
    };
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

  afterDeploy() {
    const bucket =
      this.serverless.service.resources.Resources.StaticFilesBucket.Properties
        .BucketName;
    const profile = this.serverless.service.provider.profile;
    execSync(
      `aws s3 sync .next/static s3://${bucket}/_next/static ${
        profile ? `--profile ${profile}` : ""
      } --delete`,
      {
        stdio: "inherit",
      }
    );
    execSync(
      `aws s3 sync public s3://${bucket}/public ${
        profile ? `--profile ${profile}` : ""
      } --delete`,
      {
        stdio: "inherit",
      }
    );
  }
}

module.exports = LambdaNextjsPlugin;
