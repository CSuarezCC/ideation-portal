# Deployment Architecture — Unit 4: Evaluation Engine

## Deployment Model

Same as Units 1-3 — all resources in single `template.yaml`, deployed via `sam build && sam deploy`.

## Architecture Diagram (Unit 4 additions highlighted)

```
                    API Gateway (HTTP API)
                           |
              Lambda Authorizer (Unit 1)
                           |
    +----------+-----------+-----------+-----------+
    |          |           |           |           |
  Auth/User  Campaign   Idea       Evaluation   [Future]
  (U1)       (U2)       (U3)       (U4)
    |          |           |           |
    v          v           v           v
  Users     Campaigns    Ideas     Evaluations    AggregatedScores
  Table     Table        Table     Table          Table
                           ^           |               |
                           |           v               v
                           +--- triggerAggregation ----+
                                       |
                                       v
                                  EventBridge
                           (evaluation.submitted)
                           (evaluation.aggregation-complete)
```

## EventBridge Events (published by Unit 4)

| Detail Type | Published When | Payload |
|---|---|---|
| EvaluationSubmitted | Panel member submits evaluation | ideaId, campaignId, panelMemberId |
| EvaluationAggregationComplete | All panel members scored, aggregation done | ideaId, campaignId, compositeScore |

Consumed by: Unit 5 (Dashboard refresh), Unit 6 (Notifications)

## DynamoDB Tables Used (provisioned in Unit 1)

| Table | Access | Notes |
|---|---|---|
| EvaluationsTable | CRUD | PK: ideaId, SK: panelMemberId, GSI: panelMemberId-index |
| AggregatedScoresTable | CRUD | PK: ideaId, GSI: campaignId-compositeScore-index |
| IdeasTable | Read + status update | Status transition to EVALUATED on aggregation |
| CampaignsTable | Read | Verify panel member assignment and campaign status |
