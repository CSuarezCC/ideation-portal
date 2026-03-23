# Application Design — Ideation Portal

## Overview

The Ideation Portal is a serverless, event-driven web application deployed on AWS. It enables employees to submit innovative ideas, panel members to independently evaluate them using blind scoring, and admins to manage campaigns and recognize top performers.

**Architecture Style**: Serverless microservices (Lambda-per-service) + Event-driven async workflows (EventBridge)
**Frontend**: React SPA (TypeScript) hosted on S3 + CloudFront
**Backend**: Node.js Lambda functions (TypeScript) behind API Gateway
**Database**: Amazon DynamoDB (NoSQL, on-demand capacity)
**Auth**: Amazon Cognito User Pool (username/password, JWT)
**IaC**: AWS SAM (`template.yaml`)

---

## Component Summary

| # | Component | Type | Primary AWS Resources |
|---|---|---|---|
| 1 | AuthComponent | Lambda + Cognito | Cognito User Pool, Lambda Authorizer |
| 2 | UserComponent | Lambda | DynamoDB (Users) |
| 3 | CampaignComponent | Lambda + EventBridge | DynamoDB (Campaigns, Categories), EventBridge |
| 4 | IdeaComponent | Lambda + EventBridge | DynamoDB (Ideas), S3, EventBridge |
| 5 | EvaluationComponent | Lambda + EventBridge | DynamoDB (Evaluations, AggregatedScores), EventBridge |
| 6 | DashboardComponent | Lambda + EventBridge | DynamoDB (AggregatedScores, Ideas) |
| 7 | AnalyticsComponent | Lambda | DynamoDB (read-only) |
| 8 | NotificationComponent | Lambda + EventBridge | DynamoDB (Notifications), EventBridge |
| 9 | RecognitionComponent | Lambda + EventBridge | DynamoDB (Winners), EventBridge |
| 10 | FrontendComponent | React SPA | S3, CloudFront |

---

## Architecture Diagram

```
+------------------+        HTTPS         +------------------+
|  React SPA       | -------------------> | CloudFront + S3  |
|  (TypeScript)    |                       +------------------+
+------------------+
        |
        | REST API calls
        v
+------------------+
|  API Gateway     |
|  (HTTP API)      |
+------------------+
        |
        | Lambda Authorizer (JWT validation)
        |
        +----------+----------+----------+----------+----------+
        |          |          |          |          |          |
        v          v          v          v          v          v
   AuthSvc    UserSvc   CampaignSvc  IdeaSvc  EvalSvc  DashSvc
   Lambda     Lambda     Lambda      Lambda   Lambda   Lambda
        |          |          |          |          |
        |          |          |          |          |
        +----------+----------+----------+----------+
                             |
                             v
                    +------------------+
                    |  DynamoDB        |
                    |  (Tables per     |
                    |   service)       |
                    +------------------+

                    +------------------+
                    |  EventBridge     |  <-- Async events between services
                    |  (Custom Bus)    |
                    +------------------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
       NotificationSvc  RecognitionSvc  EvalSvc
       Lambda           Lambda          Lambda
                                        (aggregation)

                    +------------------+
                    |  Amazon S3       |  <-- Idea attachments (pre-signed URLs)
                    +------------------+

                    +------------------+
                    |  Cognito         |  <-- User Pool (auth)
                    |  User Pool       |
                    +------------------+
```

---

## Role-Based Access Summary

| Capability | Employee | Panel Member | Admin |
|---|---|---|---|
| Register / Login | Yes | Yes | Yes |
| Submit ideas, save drafts | Yes | Yes | Yes |
| View own ideas | Yes | Yes | Yes |
| View leaderboard | Yes | Yes | Yes |
| Score ideas (blind) | No | Yes | No |
| View full score breakdowns | No | Yes | Yes |
| Access analytics | No | Yes | Yes |
| Manage campaigns | No | No | Yes |
| Manage users / roles | No | No | Yes |
| Manage categories | No | No | Yes |
| Trigger campaign status transitions | No | No | Yes |

---

## Key Design Decisions

### Blind Scoring Enforcement
Enforced server-side in EvaluationComponent. The `getEvaluationSummary` and `getAggregatedScore` endpoints check whether the requesting panel member has submitted their own scores before returning other members' scores. This cannot be bypassed via the frontend.

### Score Aggregation
Triggered asynchronously via EventBridge after each evaluation submission. EvaluationComponent checks if all assigned panel members have scored an idea; if yes, it calculates per-dimension averages and composite score, stores in `AggregatedScores` table, and publishes `evaluation.aggregation-complete`.

### Campaign Lifecycle State Machine
Managed exclusively by CampaignComponent. Valid transitions:
- Draft → Active (opens submissions)
- Active → Evaluation (closes submissions, opens scoring)
- Evaluation → Closed (closes scoring, triggers recognition)
- Closed → Announced (winners published)

Only one campaign may be in Active status at a time (enforced at service level).

### Draft Auto-Save
IdeaComponent exposes a dedicated `autoSaveDraft` endpoint that accepts partial data without full validation, enabling the frontend to call it on a 30-second timer without blocking the user.

### Event-Driven Notifications
NotificationComponent is fully decoupled from all other services. It consumes EventBridge events and creates in-portal notifications without any direct service-to-service calls.

---

## Detailed Artifacts

- Component definitions and responsibilities: `components.md`
- Method signatures per component: `component-methods.md`
- Service definitions and API routes: `services.md`
- Dependency matrix, data flows, event schemas: `component-dependency.md`
