# Unit of Work Dependencies — Ideation Portal

## Dependency Matrix

| Unit | Depends On | Type |
|---|---|---|
| Unit 1: Foundation | None | Root |
| Unit 2: Campaign Management | Unit 1 | Hard (auth, user roles, DynamoDB, EventBridge) |
| Unit 3: Idea Submission | Unit 1, Unit 2 | Hard (auth; active campaign + categories) |
| Unit 4: Evaluation Engine | Unit 1, Unit 2, Unit 3 | Hard (auth; panel assignments; ideas to score) |
| Unit 5: Dashboards & Analytics | Unit 1, Unit 3, Unit 4 | Hard (auth; ideas; aggregated scores) |
| Unit 6: Notifications | Unit 1 (API), Events from 2,3,4,7 | Soft on events (event-driven consumer) |
| Unit 7: Recognition | Unit 1, Unit 4, Unit 6 | Hard (auth; scores); Soft on Unit 6 (notif events) |

---

## Dependency Graph

```
Unit 1: Foundation
    |
    +---> Unit 2: Campaign Management
    |         |
    |         +---> Unit 3: Idea Submission
    |                   |
    |                   +---> Unit 4: Evaluation Engine
    |                               |
    |                               +---> Unit 5: Dashboards & Analytics
    |                               |
    |                               +---> Unit 7: Recognition System
    |                                         |
    +---> Unit 6: Notifications <-------------+
          (consumes events from 2, 3, 4, 7)
```

---

## Critical Path

The critical path for sequential development is:

```
Unit 1 --> Unit 2 --> Unit 3 --> Unit 4 --> Unit 7
                                        \-> Unit 5
                                        \-> Unit 6 (can start after Unit 1 API, events arrive later)
```

Units 5, 6, and 7 can be developed in parallel once Unit 4 is complete.
Unit 6 (Notifications) API layer can be built after Unit 1; event consumers are wired as events become available.

---

## Shared Infrastructure Dependencies

All units depend on the following shared resources provisioned in Unit 1:

| Resource | Used By |
|---|---|
| API Gateway (HTTP API) | All units |
| Lambda Authorizer | All units |
| Cognito User Pool | All units |
| EventBridge Custom Bus | Units 2, 3, 4, 6, 7 |
| DynamoDB (all tables provisioned in Unit 1) | All units |
| S3 Bucket (attachments) | Unit 3 |
| S3 Bucket (frontend) + CloudFront | Frontend (all units) |
| Shared backend middleware | All backend units |
| Shared DynamoDB client | All backend units |
| Shared EventBridge client | Units 2, 3, 4, 7 |

---

## Integration Points Between Units

| From Unit | To Unit | Integration Type | Details |
|---|---|---|---|
| Unit 2 | Unit 3 | API call | IdeaService calls CampaignService to get active campaign on submit |
| Unit 2 | Unit 4 | API call | EvaluationService calls CampaignService to get panel assignments |
| Unit 2 | Unit 6 | EventBridge | `campaign.activated`, `campaign.evaluation-started`, `campaign.closed` |
| Unit 3 | Unit 4 | DynamoDB read | EvaluationService reads Ideas table for idea metadata |
| Unit 3 | Unit 5 | DynamoDB read | DashboardService reads Ideas table |
| Unit 3 | Unit 6 | EventBridge | `idea.submitted` |
| Unit 4 | Unit 5 | DynamoDB read | DashboardService reads AggregatedScores table |
| Unit 4 | Unit 6 | EventBridge | `evaluation.aggregation-complete` |
| Unit 4 | Unit 7 | DynamoDB read | RecognitionService reads AggregatedScores table |
| Unit 7 | Unit 3 | DynamoDB write | RecognitionService updates idea status to Winner |
| Unit 7 | Unit 6 | EventBridge | `recognition.winners-announced` |
