# Deployment Architecture — Unit 6: Notifications

## API Routes

| Method | Path | Function | Auth |
|---|---|---|---|
| GET | /notifications | GetNotificationsFunction | All roles |
| GET | /notifications/unread-count | GetUnreadCountFunction | All roles |
| PUT | /notifications/{notificationId}/read | MarkAsReadFunction | All roles |
| PUT | /notifications/read-all | MarkAllAsReadFunction | All roles |

## EventBridge Events Consumed

| Event | Source | Consumer |
|---|---|---|
| idea.submitted | Unit 3 (IdeaService) | NotificationEventConsumerFunction |
| campaign.activated | Unit 2 (CampaignService) | NotificationEventConsumerFunction |
| campaign.evaluation-started | Unit 2 (CampaignService) | NotificationEventConsumerFunction |
| campaign.closed | Unit 2 (CampaignService) | NotificationEventConsumerFunction |
| evaluation.aggregation-complete | Unit 4 (EvaluationService) | NotificationEventConsumerFunction |
| recognition.winners-announced | Unit 7 (RecognitionService) | NotificationEventConsumerFunction (placeholder) |

## Architecture Diagram

```
                                    ┌──────────────────┐
                                    │   EventBridge     │
                                    │   (6 event types) │
                                    └────────┬─────────┘
                                             │
                                             ▼
┌─────────────┐     ┌──────────────┐  ┌──────────────────────┐
│   Frontend   │────▶│  API Gateway  │  │  NotificationEvent   │
│  (React SPA) │     │   (HttpApi)   │  │  ConsumerFunction    │
└─────────────┘     └──────┬───────┘  └──────────┬───────────┘
                           │                      │
              ┌────────────┤                      │
              ▼            ▼                      ▼
     ┌────────────┐ ┌───────────┐     ┌─────────────────────┐
     │ Notification│ │ Notification│    │   DynamoDB (R/W)     │
     │ API Handlers│ │ API Handlers│    │   Notifications +    │
     │  (4 fns)    │ │            │    │   Ideas/Campaigns/   │
     └─────┬──────┘ └────────────┘    │   Users (Read)       │
           │                           └─────────────────────┘
           ▼
     ┌─────────────────┐
     │  NotificationsTable │
     │  (Read/Write)       │
     └─────────────────┘
```
