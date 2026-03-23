# Tech Stack Decisions — Unit 1: Foundation

## Backend

| Concern | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 22.14.0 (Lambda) | User specified; latest LTS, excellent cold start performance |
| Language | TypeScript (strict) | Type safety, better DX, consistent with frontend |
| Lambda framework | AWS Lambda handler (no framework) | Minimal overhead; SAM handles routing via API Gateway |
| Auth provider | Amazon Cognito User Pool | Managed auth, JWT issuance, SRP password handling, no custom crypto |
| JWT validation | `aws-jwt-verify` library | AWS-maintained, lightweight, designed for Cognito JWTs |
| DynamoDB client | `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` (v3) | Official AWS SDK v3, tree-shakeable, TypeScript-native |
| EventBridge client | `@aws-sdk/client-eventbridge` (v3) | Official AWS SDK v3 |
| Build tool | esbuild (via SAM build) | Fast bundling, tree-shaking, small Lambda packages |
| Testing | Jest + ts-jest | Standard Node.js testing; good TypeScript support |

## Frontend

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 | User specified |
| Language | TypeScript (strict) | User specified |
| Build tool | Vite | Fast dev server and build; excellent TypeScript support |
| Routing | React Router v6 | Standard SPA routing |
| State management | React Context + hooks (Unit 1) | Sufficient for auth state; more complex state in later units |
| HTTP client | Axios | Interceptors for token injection and refresh; familiar API |
| Form handling | React Hook Form | Minimal re-renders, built-in validation |
| Styling | Tailwind CSS | Utility-first, no runtime overhead, consistent design system |
| Testing | Vitest + React Testing Library | Fast, Vite-native, good component testing |

## Infrastructure

| Concern | Choice | Rationale |
|---|---|---|
| IaC | AWS SAM (`template.yaml`) | User specified; native Lambda/API Gateway support |
| API Gateway | HTTP API (not REST API) | Lower cost, lower latency, sufficient for this use case |
| Database | Amazon DynamoDB (on-demand) | User specified; auto-scaling, no server management |
| Auth | Amazon Cognito User Pool | Managed, integrates natively with API Gateway Authorizer |
| Frontend hosting | S3 + CloudFront | Standard serverless SPA hosting |
| Secrets | AWS Systems Manager Parameter Store | Store Cognito App Client Secret if needed |
| Logging | AWS CloudWatch Logs | Default Lambda logging destination |

## DynamoDB Table Design (Unit 1)

### Users Table
```
Table: ideation-portal-users
PK: userId (String)
GSI-1: email-index (PK: email) — for login lookup by email
GSI-2: role-index (PK: role) — for admin user listing by role
Attributes: userId, email, name, department, avatarUrl, role, status, createdAt, updatedAt
```

### All Other Tables (provisioned in Unit 1, populated in later units)
```
ideation-portal-campaigns     PK: campaignId
ideation-portal-categories    PK: categoryId
ideation-portal-ideas         PK: ideaId, GSI: submitterId-index, campaignId-index
ideation-portal-evaluations   PK: ideaId, SK: panelMemberId
ideation-portal-aggregated-scores  PK: ideaId
ideation-portal-notifications PK: userId, SK: notificationId
ideation-portal-winners       PK: campaignId, SK: rank
```
