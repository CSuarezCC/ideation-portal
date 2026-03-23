# Build Instructions

## Prerequisites
- Node.js 22.14.0
- AWS CLI configured with credentials
- AWS SAM CLI installed
- An AWS account with permissions for Lambda, DynamoDB, API Gateway, EventBridge, S3, CloudFront, Cognito

## Build Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
npm install ulid  # Required by notifications/processEvent.ts
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Type-Check Backend
```bash
cd backend
npm run build
```
Expected: `tsc --noEmit` completes with 0 errors.

### 4. Build Frontend
```bash
cd frontend
npm run build
```
Expected: `tsc && vite build` completes. Output in `frontend/dist/`.

### 5. Build SAM Application
```bash
# From project root
sam build
```
Expected: All Lambda functions built successfully. Output in `.aws-sam/build/`.

### 6. Deploy Backend (First Time)
```bash
sam deploy --guided
```
For subsequent deployments:
```bash
sam deploy
```
Uses `samconfig.toml` defaults (stack: `ideation-portal-dev`, region: `us-east-1`).

### 7. Configure Frontend Environment
```bash
cp frontend/.env.example frontend/.env
```
Edit `frontend/.env` with values from SAM stack outputs:
- `VITE_API_URL` — HttpApi endpoint URL
- `VITE_USER_POOL_ID` — Cognito User Pool ID
- `VITE_USER_POOL_CLIENT_ID` — Cognito App Client ID

### 8. Deploy Frontend
```bash
cd frontend
npm run build
aws s3 sync dist/ s3://{FrontendBucketName} --delete
aws cloudfront create-invalidation --distribution-id {DistributionId} --paths "/*"
```

## Troubleshooting

### SAM Build Fails with TypeScript Errors
- Run `cd backend && npm run build` first to see specific TS errors
- Ensure all shared types are exported correctly from `backend/src/shared/types/index.ts`

### Missing `ulid` Package
- The `ulid` package is used in `backend/src/notifications/processEvent.ts` but may not be in package.json
- Fix: `cd backend && npm install ulid`

### Frontend Build Fails
- Ensure all imported components exist
- Run `cd frontend && npx tsc --noEmit` to see TS errors before Vite build
