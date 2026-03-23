# Infrastructure Design — Unit 1: Foundation

## Overview

All infrastructure is defined in a single `template.yaml` (AWS SAM) at the workspace root. Unit 1 provisions the complete infrastructure skeleton — all tables, all Lambda stubs, API Gateway, Cognito, EventBridge, S3, and CloudFront. Later units add their Lambda function implementations but the infrastructure resources are all declared here.

---

## SAM Template Structure

```yaml
# template.yaml (top-level structure)

AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Ideation Portal — Serverless AWS SAM

Globals:
  Function:
    Runtime: nodejs22.x
    Architectures: [arm64]          # Graviton2 — better price/performance
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        USERS_TABLE: !Ref UsersTable
        CAMPAIGNS_TABLE: !Ref CampaignsTable
        CATEGORIES_TABLE: !Ref CategoriesTable
        IDEAS_TABLE: !Ref IdeasTable
        EVALUATIONS_TABLE: !Ref EvaluationsTable
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        NOTIFICATIONS_TABLE: !Ref NotificationsTable
        WINNERS_TABLE: !Ref WinnersTable
        EVENT_BUS_NAME: !Ref IdeationEventBus
        USER_POOL_ID: !Ref CognitoUserPool
        USER_POOL_CLIENT_ID: !Ref CognitoUserPoolClient
        ATTACHMENTS_BUCKET: !Ref AttachmentsBucket

Resources:
  # --- Auth & API ---
  CognitoUserPool
  CognitoUserPoolClient
  HttpApi (API Gateway HTTP API)
  LambdaAuthorizer

  # --- Unit 1: Auth & User Lambda Functions ---
  RegisterFunction
  LoginFunction
  RefreshTokenFunction
  ConfirmAccountFunction
  ForgotPasswordFunction
  ResetPasswordFunction
  GetProfileFunction
  UpdateProfileFunction
  ListUsersFunction
  AssignRoleFunction
  DeactivateUserFunction

  # --- Unit 2: Campaign Lambda stubs (implemented in Unit 2) ---
  CreateCampaignFunction, UpdateCampaignFunction, ...

  # --- Unit 3–7: Lambda stubs (implemented in respective units) ---
  ...

  # --- DynamoDB Tables ---
  UsersTable
  CampaignsTable
  CategoriesTable
  IdeasTable
  EvaluationsTable
  AggregatedScoresTable
  NotificationsTable
  WinnersTable

  # --- EventBridge ---
  IdeationEventBus

  # --- S3 ---
  AttachmentsBucket
  FrontendBucket

  # --- CloudFront ---
  FrontendDistribution

Outputs:
  ApiUrl
  UserPoolId
  UserPoolClientId
  FrontendUrl
```

---

## Resource Specifications

### Cognito User Pool
```yaml
CognitoUserPool:
  Type: AWS::Cognito::UserPool
  Properties:
    UserPoolName: ideation-portal-users
    UsernameAttributes: [email]
    AutoVerifiedAttributes: [email]
    Policies:
      PasswordPolicy:
        MinimumLength: 8
        RequireUppercase: true
        RequireLowercase: true
        RequireNumbers: true
        RequireSymbols: false
    Schema:
      - Name: role
        AttributeDataType: String
        Mutable: true
    AccountRecoverySetting:
      RecoveryMechanisms:
        - Name: verified_email
          Priority: 1
```

### API Gateway (HTTP API)
```yaml
HttpApi:
  Type: AWS::Serverless::HttpApi
  Properties:
    Auth:
      DefaultAuthorizer: LambdaAuthorizer
      Authorizers:
        LambdaAuthorizer:
          AuthorizerPayloadFormatVersion: "2.0"
          FunctionArn: !GetAtt LambdaAuthorizerFunction.Arn
          Identity:
            Headers: [Authorization]
          AuthorizerResultTtlInSeconds: 300
    CorsConfiguration:
      AllowOrigins:
        - !Sub "https://${FrontendDistribution.DomainName}"
      AllowMethods: [GET, POST, PUT, DELETE, OPTIONS]
      AllowHeaders: [Authorization, Content-Type]
```

### DynamoDB Tables
```yaml
UsersTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: ideation-portal-users
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - { AttributeName: userId, AttributeType: S }
      - { AttributeName: email, AttributeType: S }
      - { AttributeName: role, AttributeType: S }
    KeySchema:
      - { AttributeName: userId, KeyType: HASH }
    GlobalSecondaryIndexes:
      - IndexName: email-index
        KeySchema: [{ AttributeName: email, KeyType: HASH }]
        Projection: { ProjectionType: ALL }
      - IndexName: role-index
        KeySchema: [{ AttributeName: role, KeyType: HASH }]
        Projection: { ProjectionType: ALL }
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
    SSESpecification:
      SSEEnabled: true
```

### EventBridge Custom Bus
```yaml
IdeationEventBus:
  Type: AWS::Events::EventBus
  Properties:
    Name: ideation-portal-events
```

### S3 Buckets
```yaml
AttachmentsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    CorsConfiguration:
      CorsRules:
        - AllowedOrigins: ['*']
          AllowedMethods: [PUT]
          AllowedHeaders: ['*']
          MaxAge: 3600

FrontendBucket:
  Type: AWS::S3::Bucket
  Properties:
    WebsiteConfiguration:
      IndexDocument: index.html
      ErrorDocument: index.html   # SPA fallback
```

### CloudFront Distribution
```yaml
FrontendDistribution:
  Type: AWS::CloudFront::Distribution
  Properties:
    DistributionConfig:
      Origins:
        - DomainName: !GetAtt FrontendBucket.RegionalDomainName
          S3OriginConfig:
            OriginAccessIdentity: !Sub "origin-access-identity/cloudfront/${OAI}"
      DefaultCacheBehavior:
        ViewerProtocolPolicy: redirect-to-https
        CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
      DefaultRootObject: index.html
      CustomErrorResponses:
        - ErrorCode: 404
          ResponseCode: 200
          ResponsePagePath: /index.html   # SPA routing fallback
      Enabled: true
```

---

## IAM Permissions (per Lambda function group)

### Auth + User Lambdas
```yaml
Policies:
  - DynamoDBCrudPolicy:
      TableName: !Ref UsersTable
  - Statement:
      - Effect: Allow
        Action:
          - cognito-idp:AdminCreateUser
          - cognito-idp:AdminSetUserPassword
          - cognito-idp:AdminUpdateUserAttributes
          - cognito-idp:AdminDisableUser
          - cognito-idp:AdminUserGlobalSignOut
        Resource: !GetAtt CognitoUserPool.Arn
```

### Lambda Authorizer
```yaml
Policies:
  - Statement:
      - Effect: Allow
        Action: []   # No AWS permissions needed — validates JWT locally
        Resource: '*'
```
