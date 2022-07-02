/**
 * Bridge between requests and nextjs server
 *
 * @module shim
 */

const NextServer = require("next/dist/server/next-server").default;

const path = require("path");

const adapter = require("serverless-http");

const qs = require("querystring");

// TODO: this should follow server.js info
const nextServer = new NextServer({
  hostname: "localhost",
  port: 0,
  dir: path.join(__dirname),
  dev: false,
  conf: {
    env: {},
    webpack: null,
    webpackDevMiddleware: null,
    eslint: { ignoreDuringBuilds: false },
    typescript: { ignoreBuildErrors: false, tsconfigPath: "tsconfig.json" },
    distDir: "./.next",
    cleanDistDir: true,
    assetPrefix: "",
    configOrigin: "next.config.js",
    useFileSystemPublicRoutes: true,
    generateEtags: true,
    pageExtensions: ["tsx", "ts", "jsx", "js"],
    target: "server",
    poweredByHeader: true,
    compress: true,
    analyticsId: "",
    images: {
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      path: "/_next/image",
      loader: "default",
      domains: [],
      disableStaticImages: false,
      minimumCacheTTL: 60,
      formats: ["image/webp"],
      dangerouslyAllowSVG: false,
      contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
    },
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: "bottom-right",
    },
    onDemandEntries: { maxInactiveAge: 15000, pagesBufferLength: 2 },
    amp: { canonicalBase: "" },
    basePath: "",
    sassOptions: {},
    trailingSlash: false,
    i18n: null,
    productionBrowserSourceMaps: false,
    optimizeFonts: true,
    excludeDefaultMomentLocales: true,
    serverRuntimeConfig: {},
    publicRuntimeConfig: {},
    reactStrictMode: true,
    httpAgentOptions: { keepAlive: true },
    outputFileTracing: true,
    staticPageGenerationTimeout: 60,
    swcMinify: false,
    output: "standalone",
    experimental: {
      manualClientBasePath: false,
      legacyBrowsers: true,
      browsersListForSwc: false,
      newNextLinkBehavior: false,
      cpus: 7,
      sharedPool: true,
      plugins: false,
      profiling: false,
      isrFlushToDisk: true,
      workerThreads: false,
      pageEnv: false,
      optimizeCss: false,
      nextScriptWorkers: false,
      scrollRestoration: false,
      externalDir: false,
      disableOptimizedLoading: false,
      gzipSize: true,
      swcFileReading: true,
      craCompat: false,
      esmExternals: true,
      appDir: false,
      isrMemoryCacheSize: 52428800,
      serverComponents: false,
      fullySpecified: false,
      outputFileTracingRoot: "",
      images: { layoutRaw: false, remotePatterns: [] },
      forceSwcTransforms: false,
      largePageDataBytes: 128000,
      trustHostHeader: false,
    },
    configFileName: "next.config.js",
  },
});

const nextHandler = nextServer.getRequestHandler();

async function handler(req, res) {
  if (req.headers["content-type"] === "application/x-www-form-urlencoded") {
    req.body = Object.fromEntries(
      new URLSearchParams(req.body.toString()).entries()
    );
  }
  await nextHandler(req, res);
}

module.exports = {
  handler: adapter(handler),
};
