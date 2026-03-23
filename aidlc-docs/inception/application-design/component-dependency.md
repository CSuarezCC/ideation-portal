# Component Dependencies — Ideation Portal

## Dependency Matrix

| Component | Depends On | Communication Pattern |
|---|---|---|
| AuthComponent | Cognito (AWS) | SDK call |
| UserComponent | AuthComponent (identity), DynamoDB | API call (auth context), DB read/write |
| CampaignComponent | UserComponent (panel member lookup), DynamoDB, EventBridge | API call, DB read/write, event publish |
| IdeaComponent | CampaignComponent (active campaign), UserComponent (submitter), DynamoDB, S3, EventBridge | API call, DB read/write, event publish |
| EvaluationComponent | IdeaComponent (idea data), CampaignComponent (panel assignments), DynamoDB, EventBridge | API call, DB read/write, event publish/consume |
| DashboardComponent | EvaluationComponent (aggregated scores), IdeaComponent (idea data), DynamoDB | DB read, event consume |
| AnalyticsComponent | EvaluationComponent (scores), IdeaComponent (ideas), DynamoDB | DB read |
| NotificationComponent | All components (via events), DynamoDB | Event consume, DB read/write |
| RecognitionComponent | EvaluationComponent (scores), IdeaComponent (status update), DynamoDB, EventBridge | DB read/write, event consume/publish |
| FrontendComponent | All services (via API Gateway) | HTTP REST |

---

## Data Flow Diagrams

### Flow 1: Idea Submission

```
Employee (Browser)
    |
    v
FrontendComponent
    |  POST /ideas/draft, PUT /ideas/{id}/autosave, POST /ideas/{id}/submit
    v
API Gateway --> Lambda Authorizer (AuthComponent)
    |
    v
IdeaService (IdeaComponent)
    |-- Validates active campaign via CampaignComponent
    |-- Writes to DynamoDB (Ideas table)
    |-- Uploads attachment via S3 pre-signed URL
    |-- Publishes `idea.submitted` to EventBridge
    v
EventBridge
    |
    v
NotificationService (NotificationComponent)
    |-- Creates notification for submitter (confirmation)
    |-- Creates notification for Admin (new idea alert)
```

### Flow 2: Blind Evaluation

```
PanelMember (Browser)
    |
    v
FrontendComponent
    |  GET /evaluations/ideas, POST /evaluations/{ideaId}/submit
    v
API Gateway --> Lambda Authorizer
    |
    v
EvaluationService (EvaluationComponent)
    |-- Checks if panel member has submitted own score (blind enforcement)
    |-- Writes evaluation to DynamoDB (Evaluations table)
    |-- Checks if all panel members have scored this idea
    |   |-- YES: Calls triggerAggregation()
    |   |       |-- Calculates averages, writes to AggregatedScores table
    |   |       |-- Publishes `evaluation.aggregation-complete` to EventBridge
    |   |-- NO: Waits for remaining panel members
    v
EventBridge
    |
    +-- DashboardService: refreshes leaderboard data
    +-- NotificationService: notifies idea submitter (idea evaluated)
```

### Flow 3: Campaign Close & Recognition

```
Admin (Browser)
    |
    v
FrontendComponent
    |  PUT /campaigns/{id}/status  (status: Closed)
    v
CampaignService (CampaignComponent)
    |-- Updates campaign status in DynamoDB
    |-- Publishes `campaign.closed` to EventBridge
    v
EventBridge
    |
    +-- RecognitionService (RecognitionComponent)
    |       |-- Queries top 3 ideas by composite score
    |       |-- Assigns Gold/Silver/Bronze badges
    |       |-- Creates winner announcement record
    |       |-- Updates idea status to Winner
    |       |-- Publishes `recognition.winners-announced` to EventBridge
    |
    +-- NotificationService
            |-- Notifies all users of campaign closure
            |-- (After recognition event) Notifies top 3 submitters of win
            |-- Notifies Admin to follow up with HR/management
```

### Flow 4: Dashboard / Leaderboard Read

```
Any User (Browser)
    |
    v
FrontendComponent
    |  GET /dashboard/leaderboard?campaignId=X&dimension=composite
    v
API Gateway --> Lambda Authorizer
    |
    v
DashboardService (DashboardComponent)
    |-- Queries AggregatedScores table (DynamoDB)
    |-- Queries Ideas table for metadata
    |-- Applies role-based visibility rules (full breakdown for Admin/PanelMember)
    |-- Returns ranked list
    v
FrontendComponent renders leaderboard
```

---

## Component Communication Patterns

### Synchronous (API Gateway → Lambda)
Used for: All user-initiated actions (CRUD, queries, submissions)
- Request/response via HTTP REST
- JWT validated by Lambda Authorizer on every request
- Role enforcement at service handler level

### Asynchronous (EventBridge)
Used for: Cross-service side effects (notifications, aggregation, recognition)
- Fire-and-forget from publishing service
- EventBridge routes events to subscribed Lambda consumers
- Decouples services — publisher does not wait for consumer

### Direct DB Access (DynamoDB)
Used for: Each service owns its primary tables
- Services read their own tables directly
- Cross-service data reads (e.g., DashboardComponent reading Ideas table) are acceptable for read-only analytics/dashboard use cases
- Write ownership: each table has a single owning service

---

## Event Schema Summary

| Event | Publisher | Consumers | Key Payload Fields |
|---|---|---|---|
| `idea.submitted` | IdeaComponent | NotificationComponent | ideaId, submitterId, campaignId, title |
| `campaign.activated` | CampaignComponent | NotificationComponent | campaignId, name, startDate, endDate |
| `campaign.evaluation-started` | CampaignComponent | EvaluationComponent, NotificationComponent | campaignId, evaluationEndDate |
| `campaign.closed` | CampaignComponent | RecognitionComponent, NotificationComponent | campaignId |
| `evaluation.submitted` | EvaluationComponent | EvaluationComponent (aggregation check) | ideaId, panelMemberId, campaignId |
| `evaluation.aggregation-complete` | EvaluationComponent | DashboardComponent, NotificationComponent | ideaId, campaignId, aggregatedScore |
| `recognition.winners-announced` | RecognitionComponent | NotificationComponent | campaignId, winners[{ideaId, rank, submitterId}] |
