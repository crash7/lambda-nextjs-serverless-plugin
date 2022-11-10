#!/usr/bin/env node
const webpack = require("webpack");
const path = require("path");

const compiler = webpack({
  mode: "production",
  target: "node",
  node: {
    __dirname: false,
  },
  entry: {
    bridge: `${__dirname}/lambda-bridge/handler.js`,
  },
  resolve: {
    extensions: [".js"],
  },
  optimization: {
    minimize: false,
  },
  output: {
    path: path.resolve(".vercel/output/functions/_error.func"),
    filename: "[name].js",
    libraryTarget: "commonjs2",
  },
  externals: [
    /^aws-sdk/, // Don't include the aws-sdk in bundles as it is already present in the Lambda runtime
    "./___next_launcher.cjs",
    "next/dist/server/next-server",
  ],
  performance: {
    hints: "error",
    maxAssetSize: 1048576, // Max size of deployment bundle in Lambda@Edge Viewer Request
    maxEntrypointSize: 1048576, // Max size of deployment bundle in Lambda@Edge Viewer Request
  },
  plugins: [],
});

compiler.run((err, stats) => {
  if (err) {
    console.error(err.stack || err);
    if (err.details) {
      console.error(err.details);
    }
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    console.error(info.errors);
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings);
  }
});
