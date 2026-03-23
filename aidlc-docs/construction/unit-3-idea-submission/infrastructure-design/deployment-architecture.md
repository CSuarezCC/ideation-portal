# Deployment Architecture — Unit 3: Idea Submission

## Deployment Model

Same as Units 1-2 — all resources in single `template.yaml`, deployed via `sam build && sam deploy`.

## Architecture Diagram (Unit 3 additions highlighted)

```
                    API Gateway (HTTP API)
                           |
              Lambda Authorizer (Unit 1)
                           |
    +----------+-----------+-----------+----------+
    |          |           |           |          |
  Auth/User  Campaign   Idea        [Future]   [Future]
  (U1)       (U2)       (U3)
    |          |           |
    v          v           v
  Users     Campaigns    Ideas       S3 Attachments
  Table     Table        Table       Bucket
                           |              ^
                           |              |
                           v              |
                    EventBridge     Client direct
                    (idea.submitted)  upload via
                                    pre-signed URL
```

## EventBridge Events (published by Unit 3)

| Detail Type | Published When |
|---|---|
| IdeaSubmitted | Idea transitions from DRAFT to SUBMITTED |

Consumed by: Unit 6 (Notifications)
