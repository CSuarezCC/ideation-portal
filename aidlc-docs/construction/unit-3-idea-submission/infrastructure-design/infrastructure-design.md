# Infrastructure Design — Unit 3: Idea Submission

## Overview

Unit 3 adds idea Lambda functions and API routes to the existing `template.yaml`. The Ideas table and S3 AttachmentsBucket were provisioned in Unit 1.

---

## Lambda Functions

```yaml
CreateDraftFunction:
  Handler: src/ideas/createDraft.handler
  Events:
    Api: { Path: /ideas/draft, Method: POST }
  Policies:
    - DynamoDBCrudPolicy: { TableName: !Ref IdeasTable }

UpdateDraftFunction:
  Handler: src/ideas/updateDraft.handler
  Events:
    Api: { Path: /ideas/{id}/draft, Method: PUT }
  Policies:
    - DynamoDBCrudPolicy: { TableName: !Ref IdeasTable }

AutoSaveDraftFunction:
  Handler: src/ideas/autoSaveDraft.handler
  Events:
    Api: { Path: /ideas/{id}/autosave, Method: PUT }
  Policies:
    - DynamoDBCrudPolicy: { TableName: !Ref IdeasTable }

SubmitIdeaFunction:
  Handler: src/ideas/submitIdea.handler
  Events:
    Api: { Path: /ideas/{id}/submit, Method: POST }
  Policies:
    - DynamoDBCrudPolicy: { TableName: !Ref IdeasTable }
    - DynamoDBReadPolicy: { TableName: !Ref CampaignsTable }
    - DynamoDBReadPolicy: { TableName: !Ref CategoriesTable }
    - Statement:
        - Effect: Allow
          Action: events:PutEvents
          Resource: !GetAtt IdeationEventBus.Arn

DeleteDraftFunction:
  Handler: src/ideas/deleteDraft.handler
  Events:
    Api: { Path: /ideas/{id}, Method: DELETE }
  Policies:
    - DynamoDBCrudPolicy: { TableName: !Ref IdeasTable }
    - Statement:
        - Effect: Allow
          Action: s3:DeleteObject
          Resource: !Sub ${AttachmentsBucket.Arn}/ideas/*

ListIdeasFunction:
  Handler: src/ideas/listIdeas.handler
  Events:
    Api: { Path: /ideas, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref IdeasTable }

GetMyIdeasFunction:
  Handler: src/ideas/getMyIdeas.handler
  Events:
    Api: { Path: /ideas/mine, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref IdeasTable }

GetIdeaFunction:
  Handler: src/ideas/getIdea.handler
  Events:
    Api: { Path: /ideas/{id}, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref IdeasTable }

GetUploadUrlFunction:
  Handler: src/ideas/getUploadUrl.handler
  Events:
    Api: { Path: /ideas/{id}/upload-url, Method: POST }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref IdeasTable }
    - Statement:
        - Effect: Allow
          Action: s3:PutObject
          Resource: !Sub ${AttachmentsBucket.Arn}/ideas/*
```

---

## IAM Permissions Summary

| Function | DynamoDB | S3 | EventBridge |
|---|---|---|---|
| createDraft | IdeasTable CRUD | — | — |
| updateDraft | IdeasTable CRUD | — | — |
| autoSaveDraft | IdeasTable CRUD | — | — |
| submitIdea | IdeasTable CRUD, CampaignsTable Read, CategoriesTable Read | — | PutEvents |
| deleteDraft | IdeasTable CRUD | DeleteObject (ideas/*) | — |
| listIdeas | IdeasTable Read | — | — |
| getMyIdeas | IdeasTable Read | — | — |
| getIdea | IdeasTable Read | — | — |
| getUploadUrl | IdeasTable Read | PutObject (ideas/*) | — |

## API Route Map

```
POST   /ideas/draft           → CreateDraftFunction      [Employee, Admin]
PUT    /ideas/{id}/draft       → UpdateDraftFunction      [Employee, Admin]
PUT    /ideas/{id}/autosave    → AutoSaveDraftFunction    [Employee, Admin]
POST   /ideas/{id}/submit      → SubmitIdeaFunction       [Employee, Admin]
DELETE /ideas/{id}             → DeleteDraftFunction      [Employee, Admin]
GET    /ideas                  → ListIdeasFunction        [All]
GET    /ideas/mine             → GetMyIdeasFunction       [All]
GET    /ideas/{id}             → GetIdeaFunction          [All]
POST   /ideas/{id}/upload-url  → GetUploadUrlFunction     [Employee, Admin]
```
