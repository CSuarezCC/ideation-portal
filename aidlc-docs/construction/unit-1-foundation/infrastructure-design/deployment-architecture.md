# Deployment Architecture — Unit 1: Foundation

## Deployment Model

**Tool**: AWS SAM CLI
**IaC**: `template.yaml` at workspace root
**Deployment command**: `sam build && sam deploy --guided` (first time) / `sam deploy` (subsequent)

## Environment Strategy

| Environment | Stack Name | Notes |
|---|---|---|
| Development | `ideation-portal-dev` | Developer testing |
| Staging | `ideation-portal-staging` | Pre-production validation |
| Production | `ideation-portal-prod` | Live environment |

All environments use the same `template.yaml` with environment-specific parameter overrides via `samconfig.toml`.

## Architecture Diagram

```
Internet
    |
    v
+---------------------------+
|  CloudFront Distribution  |  (HTTPS, CDN)
+---------------------------+
    |                   |
    v                   v
+----------+    +------------------+
| S3 SPA   |    | API Gateway      |
| Frontend |    | (HTTP API)       |
+----------+    +------------------+
                        |
                        | Lambda Authorizer (JWT validation)
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
    AuthLambdas   UserLambdas   [Other unit Lambdas]
          |             |
          v             v
    +----------+  +----------+
    | Cognito  |  | DynamoDB |
    | UserPool |  | Users    |
    +----------+  +----------+
                        |
                  [All other DynamoDB tables]
                  [EventBridge Custom Bus]
                  [S3 Attachments Bucket]
```

## Build & Deploy Steps

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Build SAM (bundles Lambda functions with esbuild)
sam build

# 3. Deploy (first time — interactive)
sam deploy --guided

# 4. Build and deploy frontend
cd frontend
npm run build
aws s3 sync dist/ s3://{FrontendBucketName} --delete
aws cloudfront create-invalidation --distribution-id {DistributionId} --paths "/*"
```

## Key Outputs (from SAM stack)

| Output | Description |
|---|---|
| `ApiUrl` | API Gateway base URL (used by frontend as `VITE_API_URL`) |
| `UserPoolId` | Cognito User Pool ID |
| `UserPoolClientId` | Cognito App Client ID |
| `FrontendUrl` | CloudFront distribution URL |
| `AttachmentsBucketName` | S3 bucket for idea attachments |

## Frontend Environment Configuration

```
# frontend/.env.production
VITE_API_URL=https://{ApiUrl}
VITE_USER_POOL_ID={UserPoolId}
VITE_USER_POOL_CLIENT_ID={UserPoolClientId}
```

These values are populated from SAM stack outputs after deployment.
