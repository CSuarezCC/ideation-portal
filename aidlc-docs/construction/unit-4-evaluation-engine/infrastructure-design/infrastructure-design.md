# Infrastructure Design — Unit 4: Evaluation Engine

## Overview

Unit 4 adds 7 evaluation Lambda functions and API routes to the existing `template.yaml`. The Evaluations and AggregatedScores tables were provisioned in Unit 1.

---

## Lambda Functions

```yaml
GetIdeasForEvaluationFunction:
  Handler: src/handlers/evaluations/getIdeasForEvaluation.handler
  Events:
    Api: { Path: /evaluations/ideas, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref IdeasTable }
    - DynamoDBReadPolicy: { TableName: !Ref EvaluationsTable }
    - DynamoDBReadPolicy: { TableName: !Ref CampaignsTable }

GetPendingEvaluationsFunction:
  Handler: src/handlers/evaluations/getPendingEvaluations.handler
  Events:
    Api: { Path: /evaluations/pending, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref IdeasTable }
    - DynamoDBReadPolicy: { TableName: !Ref EvaluationsTable }
    - DynamoDBReadPolicy: { TableName: !Ref CampaignsTable }

GetMyEvaluationFunction:
  Handler: src/handlers/evaluations/getMyEvaluation.handler
  Events:
    Api: { Path: /evaluations/{ideaId}/mine, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref EvaluationsTable }

SaveEvaluationProgressFunction:
  Handler: src/handlers/evaluations/saveEvaluationProgress.handler
  Events:
    Api: { Path: /evaluations/{ideaId}/progress, Method: PUT }
  Policies:
    - DynamoDBCrudPolicy: { TableName: !Ref EvaluationsTable }
    - DynamoDBReadPolicy: { TableName: !Ref CampaignsTable }

SubmitEvaluationFunction:
  Handler: src/handlers/evaluations/submitEvaluation.handler
  Events:
    Api: { Path: /evaluations/{ideaId}/submit, Method: POST }
  Policies:
    - DynamoDBCrudPolicy: { TableName: !Ref EvaluationsTable }
    - DynamoDBCrudPolicy: { TableName: !Ref AggregatedScoresTable }
    - DynamoDBCrudPolicy: { TableName: !Ref IdeasTable }
    - DynamoDBReadPolicy: { TableName: !Ref CampaignsTable }
    - Statement:
        - Effect: Allow
          Action: events:PutEvents
          Resource: !GetAtt IdeationEventBus.Arn

GetEvaluationSummaryFunction:
  Handler: src/handlers/evaluations/getEvaluationSummary.handler
  Events:
    Api: { Path: /evaluations/{ideaId}/summary, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref AggregatedScoresTable }
    - DynamoDBReadPolicy: { TableName: !Ref EvaluationsTable }

GetAggregatedScoreFunction:
  Handler: src/handlers/evaluations/getAggregatedScore.handler
  Events:
    Api: { Path: /evaluations/{ideaId}/score, Method: GET }
  Policies:
    - DynamoDBReadPolicy: { TableName: !Ref AggregatedScoresTable }
```

---

## IAM Permissions Summary

| Function | DynamoDB | EventBridge |
|---|---|---|
| getIdeasForEvaluation | Ideas Read, Evaluations Read, Campaigns Read | — |
| getPendingEvaluations | Ideas Read, Evaluations Read, Campaigns Read | — |
| getMyEvaluation | Evaluations Read | — |
| saveEvaluationProgress | Evaluations CRUD, Campaigns Read | — |
| submitEvaluation | Evaluations CRUD, AggregatedScores CRUD, Ideas CRUD, Campaigns Read | PutEvents |
| getEvaluationSummary | AggregatedScores Read, Evaluations Read | — |
| getAggregatedScore | AggregatedScores Read | — |

## API Route Map

```
GET    /evaluations/ideas              → GetIdeasForEvaluationFunction   [PanelMember, Admin]
GET    /evaluations/pending            → GetPendingEvaluationsFunction   [PanelMember]
GET    /evaluations/{ideaId}/mine      → GetMyEvaluationFunction         [PanelMember]
PUT    /evaluations/{ideaId}/progress  → SaveEvaluationProgressFunction  [PanelMember]
POST   /evaluations/{ideaId}/submit    → SubmitEvaluationFunction        [PanelMember]
GET    /evaluations/{ideaId}/summary   → GetEvaluationSummaryFunction    [PanelMember, Admin]
GET    /evaluations/{ideaId}/score     → GetAggregatedScoreFunction      [All]
```
