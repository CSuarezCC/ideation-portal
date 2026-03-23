# Ideation Portal

A serverless AWS platform enabling employees to submit, evaluate, and recognize innovative ideas.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js 22.14.0 Lambda functions (TypeScript)
- **Database**: Amazon DynamoDB (on-demand)
- **Auth**: Amazon Cognito User Pool
- **API**: AWS API Gateway (HTTP API)
- **Events**: Amazon EventBridge
- **Storage**: Amazon S3
- **CDN**: Amazon CloudFront
- **IaC**: AWS SAM (`template.yaml`)

## Prerequisites

- Node.js 22.14.0
- AWS CLI configured
- AWS SAM CLI installed
- An AWS account

## Setup

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Build and deploy backend

```bash
# First deployment (interactive)
sam build
sam deploy --guided

# Subsequent deployments
sam build && sam deploy
```

### 3. Configure frontend

```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env with values from SAM stack outputs
```

### 4. Build and deploy frontend

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://{FrontendBucketName} --delete
aws cloudfront create-invalidation --distribution-id {DistributionId} --paths "/*"
```

## Development

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Local API (requires SAM CLI)
sam local start-api
```

## Project Structure

```
/
├── template.yaml          # AWS SAM — all infrastructure
├── samconfig.toml         # SAM deployment configs (dev/staging/prod)
├── backend/               # Lambda functions (TypeScript)
│   └── src/
│       ├── auth/          # Auth handlers (Unit 1)
│       ├── users/         # User handlers (Unit 1)
│       ├── campaigns/     # Campaign handlers (Unit 2)
│       ├── ideas/         # Idea handlers (Unit 3)
│       ├── evaluations/   # Evaluation handlers (Unit 4)
│       ├── dashboard/     # Dashboard handlers (Unit 5)
│       ├── analytics/     # Analytics handlers (Unit 5)
│       ├── notifications/ # Notification handlers (Unit 6)
│       ├── recognition/   # Recognition handlers (Unit 7)
│       └── shared/        # Shared middleware, DB client, types
└── frontend/              # React SPA (TypeScript)
    └── src/
        ├── pages/         # Page components
        ├── components/    # Shared UI components
        ├── context/       # React context (auth)
        └── services/      # API client modules
```
