# Infrastructure Design — Unit 2: Campaign & Category Management

## Overview

Unit 2 adds campaign and category Lambda functions and API routes to the existing `template.yaml`. All base infrastructure (API Gateway, DynamoDB tables, EventBridge bus) was provisioned in Unit 1. Unit 2 implements the campaign/category Lambda stubs and refines table GSI definitions.

---

## Lambda Functions to Add/Implement

### Campaign Handlers

```yaml
# --- Campaign CRUD ---
CreateCampaignFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/createCampaign.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns
          Method: POST
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable

ListCampaignsFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/listCampaigns.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns
          Method: GET
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable
      - Statement:
          - Effect: Allow
            Action: events:PutEvents
            Resource: !GetAtt IdeationEventBus.Arn

GetActiveCampaignFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/getActiveCampaign.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/active
          Method: GET
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable
      - Statement:
          - Effect: Allow
            Action: events:PutEvents
            Resource: !GetAtt IdeationEventBus.Arn

GetCampaignFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/getCampaign.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/{id}
          Method: GET
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable
      - Statement:
          - Effect: Allow
            Action: events:PutEvents
            Resource: !GetAtt IdeationEventBus.Arn

UpdateCampaignFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/updateCampaign.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/{id}
          Method: PUT
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable

TransitionStatusFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/transitionStatus.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/{id}/status
          Method: PUT
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable
      - Statement:
          - Effect: Allow
            Action: events:PutEvents
            Resource: !GetAtt IdeationEventBus.Arn

DeleteCampaignFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/deleteCampaign.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/{id}
          Method: DELETE
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable

AssignPanelMembersFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/assignPanelMembers.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/{id}/panel-members
          Method: POST
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable

GetPanelMembersFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/getPanelMembers.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/{id}/panel-members
          Method: GET
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref CampaignsTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable
```

### Category Handlers

```yaml
ListCategoriesFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/listCategories.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/categories
          Method: GET
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref CategoriesTable

CreateCategoryFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/createCategory.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/categories
          Method: POST
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CategoriesTable

UpdateCategoryFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/updateCategory.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/categories/{categoryId}
          Method: PUT
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CategoriesTable

DeactivateCategoryFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/campaigns/deactivateCategory.handler
    CodeUri: backend/
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /campaigns/categories/{categoryId}/deactivate
          Method: PUT
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref CategoriesTable
```

---

## DynamoDB Table GSI Refinements

### Campaigns Table (update existing stub from Unit 1)

```yaml
CampaignsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: ideation-portal-campaigns
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - { AttributeName: campaignId, AttributeType: S }
      - { AttributeName: status, AttributeType: S }
      - { AttributeName: createdAt, AttributeType: S }
    KeySchema:
      - { AttributeName: campaignId, KeyType: HASH }
    GlobalSecondaryIndexes:
      - IndexName: status-createdAt-index
        KeySchema:
          - { AttributeName: status, KeyType: HASH }
          - { AttributeName: createdAt, KeyType: RANGE }
        Projection: { ProjectionType: ALL }
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
    SSESpecification:
      SSEEnabled: true
```

### Categories Table (update existing stub from Unit 1)

```yaml
CategoriesTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: ideation-portal-categories
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - { AttributeName: categoryId, AttributeType: S }
      - { AttributeName: isActive, AttributeType: S }
      - { AttributeName: name, AttributeType: S }
    KeySchema:
      - { AttributeName: categoryId, KeyType: HASH }
    GlobalSecondaryIndexes:
      - IndexName: isActive-name-index
        KeySchema:
          - { AttributeName: isActive, KeyType: HASH }
          - { AttributeName: name, KeyType: RANGE }
        Projection: { ProjectionType: ALL }
    PointInTimeRecoverySpecification:
      PointInTimeRecoveryEnabled: true
    SSESpecification:
      SSEEnabled: true
```

---

## IAM Permissions Summary

| Function Group | DynamoDB Access | EventBridge | Other |
|---|---|---|---|
| Campaign CRUD (create, update, delete) | CampaignsTable CRUD | — | — |
| Campaign Read + Lazy Transition (get, list, getActive) | CampaignsTable CRUD | PutEvents | — |
| Status Transition | CampaignsTable CRUD | PutEvents | — |
| Panel Member Assignment | CampaignsTable CRUD, UsersTable Read | — | — |
| Panel Member Read | CampaignsTable Read, UsersTable Read | — | — |
| Category CRUD | CategoriesTable CRUD | — | — |
| Category Read | CategoriesTable Read | — | — |
