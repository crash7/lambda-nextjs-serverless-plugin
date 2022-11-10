# AWS Lambda & Next.js serverless plugin

Plugin that helps to deploy a Next.js app using Cloudfront, API Gateway and Lambda. The plugin acts as a basic layer between a normal Next.js app, using the standalone mode and translating the API Gateway requests into the format supported by the framework.

It sits on top of the serverless framework and uses the aws-cli to upload the assets.

## Usage

1. Add the required dependencies

```sh
yarn add -D serverless lambda-nextjs-serverless-plugin
```

2. Add a `serverless.yml` file (feel free to extend/adapt it beyond this basic template)

```yml
service: your-service-name

frameworkVersion: "3"

package:
  individually: true
  excludeDevDependencies: false
  patterns:
    - "!**/*"
    - "package.json"

provider:
  name: aws
  runtime: nodejs16.x
  region: us-east-1
  memorySize: 1024
  timeout: 29
  deploymentMethod: direct
  versionFunctions: false

functions:
  nextjs-handler:
    handler: .next/standalone/bridge.handler
    description: Next.js bridge handler
    events:
      - http: GET /
      - http: GET /{uri+}
      - http: GET /_next/data/{uri+}
      - http: POST /api/{uri+}
    package:
      patterns:
        - ".next/standalone/**"

resources:
  Resources:
    StaticFilesBucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: static-${self:service}-${opt:stage}

    CloudfrontToBucketAccessIdentity:
      Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
      Properties:
        CloudFrontOriginAccessIdentityConfig:
          Comment: ${self:service}-${opt:stage}

    StaticFilesBucketPolicy:
      Type: AWS::S3::BucketPolicy
      Properties:
        Bucket:
          Ref: StaticFilesBucket
        PolicyDocument:
          Statement:
            - Sid: OriginAccess
              Effect: Allow
              Principal:
                AWS:
                  Fn::Join:
                    - " "
                    - - arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity
                      - Ref: CloudfrontToBucketAccessIdentity
              Action:
                - s3:GetObject
              Resource:
                Fn::Join:
                  - ""
                  - - Fn::GetAtt:
                        - StaticFilesBucket
                        - Arn
                    - /*

    CloudfrontGateway:
      Type: AWS::CloudFront::Distribution
      Properties:
        DistributionConfig:
          Enabled: true
          HttpVersion: http2
          IPV6Enabled: true
          Comment: ${self:service} ${opt:stage}
          DefaultCacheBehavior:
            AllowedMethods:
              - HEAD
              - DELETE
              - POST
              - GET
              - OPTIONS
              - PUT
              - PATCH
            CachedMethods:
              - GET
              - HEAD
              - OPTIONS
            Compress: true
            DefaultTTL: 0
            ForwardedValues:
              QueryString: true
              Headers:
                - Accept-Language
                - Cloudfront-Viewer-Country
              Cookies:
                Forward: all
            MaxTTL: 0
            MinTTL: 0
            TargetOriginId: lambda-handler
            ViewerProtocolPolicy: redirect-to-https
          CacheBehaviors:
            - PathPattern: robots.txt
              AllowedMethods:
                - HEAD
                - GET
              CachedMethods:
                - GET
                - HEAD
              Compress: true
              DefaultTTL: 86400
              ForwardedValues:
                QueryString: false
                Cookies:
                  Forward: none
              MaxTTL: 31536000
              MinTTL: 0
              TargetOriginId: s3-static-public
              ViewerProtocolPolicy: allow-all
            - PathPattern: manifest.json
              AllowedMethods:
                - HEAD
                - GET
              CachedMethods:
                - GET
                - HEAD
              Compress: true
              DefaultTTL: 86400
              ForwardedValues:
                QueryString: false
                Cookies:
                  Forward: none
              MaxTTL: 31536000
              MinTTL: 0
              TargetOriginId: s3-static-public
              ViewerProtocolPolicy: allow-all
            - PathPattern: favicon.ico
              AllowedMethods:
                - HEAD
                - GET
              CachedMethods:
                - GET
                - HEAD
              Compress: true
              DefaultTTL: 86400
              ForwardedValues:
                QueryString: false
                Cookies:
                  Forward: none
              MaxTTL: 31536000
              MinTTL: 0
              TargetOriginId: s3-static-public
              ViewerProtocolPolicy: allow-all
            - PathPattern: service-worker.js
              AllowedMethods:
                - HEAD
                - GET
              CachedMethods:
                - GET
                - HEAD
              Compress: true
              DefaultTTL: 86400
              ForwardedValues:
                QueryString: false
                Cookies:
                  Forward: none
              MaxTTL: 31536000
              MinTTL: 0
              TargetOriginId: s3-static-public
              ViewerProtocolPolicy: allow-all
            - PathPattern: static/*
              AllowedMethods:
                - HEAD
                - GET
              CachedMethods:
                - GET
                - HEAD
              Compress: true
              DefaultTTL: 86400
              ForwardedValues:
                QueryString: false
                Cookies:
                  Forward: none
              MaxTTL: 31536000
              MinTTL: 0
              TargetOriginId: s3-static-root
              ViewerProtocolPolicy: allow-all
            - PathPattern: _next/data/*
              AllowedMethods:
                - HEAD
                - GET
              CachedMethods:
                - GET
                - HEAD
              Compress: true
              DefaultTTL: 0
              ForwardedValues:
                QueryString: true
                Headers:
                  - Accept-Language
                  - Cloudfront-Viewer-Country
                Cookies:
                  Forward: all
              MaxTTL: 0
              MinTTL: 0
              TargetOriginId: lambda-handler
              ViewerProtocolPolicy: allow-all
            - PathPattern: _next/*
              AllowedMethods:
                - HEAD
                - GET
              CachedMethods:
                - GET
                - HEAD
              Compress: true
              DefaultTTL: 86400
              ForwardedValues:
                QueryString: false
                Cookies:
                  Forward: none
              MaxTTL: 31536000
              MinTTL: 0
              TargetOriginId: s3-static-root
              ViewerProtocolPolicy: allow-all
          Origins:
            - DomainName:
                Fn::Join:
                  - ""
                  - - Ref: StaticFilesBucket
                    - .s3.
                    - Ref: AWS::URLSuffix
              Id: s3-static-root
              S3OriginConfig:
                OriginAccessIdentity:
                  Fn::Join:
                    - ""
                    - - origin-access-identity/cloudfront/
                      - Ref: CloudfrontToBucketAccessIdentity
            - DomainName:
                Fn::Join:
                  - ""
                  - - Ref: StaticFilesBucket
                    - .s3.
                    - Ref: AWS::URLSuffix
              Id: s3-static-public
              OriginPath: /public
              S3OriginConfig:
                OriginAccessIdentity:
                  Fn::Join:
                    - ""
                    - - origin-access-identity/cloudfront/
                      - Ref: CloudfrontToBucketAccessIdentity
            - DomainName:
                Fn::Join:
                  - ""
                  - - Ref: ApiGatewayRestApi
                    - .execute-api.${self:provider.region}.
                    - Ref: AWS::URLSuffix
              OriginPath: /${opt:stage}
              Id: lambda-handler
              CustomOriginConfig:
                OriginProtocolPolicy: https-only
                OriginSSLProtocols:
                  - TLSv1.2
                  - TLSv1.1
                  - TLSv1
          PriceClass: PriceClass_100
          ViewerCertificate:
            CloudFrontDefaultCertificate: "true"

plugins:
  - serverless-offline
  - lambda-nextjs-serverless-plugin
```

3. Enable `standalone` flag in `next.config.js`

```js
const nextConfig = {
  //   ...,
  output: "standalone",
};
```

_The format above works for Next.js v12.2, for earlier versions the output needs to be enabled using the experimental flag._

## Roadmap

- [ ] Use the standalone output configuration for calling `NextServer`
- [ ] Create resources automatically to reduce serverless.yml boilerplate
- [ ] Remove dependency to aws-cli sync command
- [ ] Assets uploading has a chicken-egg situation if it's the first deployment

### Feature parity

- [ ] Add support for the next/image component

## Credits

- Uses a forked version of [`serverless-http`](https://www.npmjs.com/package/serverless-http) for the heavy lifting of converting the API Gateway to a Next.js req/res object (and the opposite).
