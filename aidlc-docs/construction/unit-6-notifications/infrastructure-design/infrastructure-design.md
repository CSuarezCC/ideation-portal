# Infrastructure Design — Unit 6: Notifications

## Lambda Function Definitions

### API Functions

#### GetNotificationsFunction
```yaml
GetNotificationsFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/handlers/notifications/getNotifications.handler
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /notifications
          Method: GET
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBReadPolicy:
          TableName: !Ref NotificationsTable
```

#### GetUnreadCountFunction
```yaml
GetUnreadCountFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/handlers/notifications/getUnreadCount.handler
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /notifications/unread-count
          Method: GET
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBReadPolicy:
          TableName: !Ref NotificationsTable
```

#### MarkAsReadFunction
```yaml
MarkAsReadFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/handlers/notifications/markAsRead.handler
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /notifications/{notificationId}/read
          Method: PUT
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBCrudPolicy:
          TableName: !Ref NotificationsTable
```

#### MarkAllAsReadFunction
```yaml
MarkAllAsReadFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/handlers/notifications/markAllAsRead.handler
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /notifications/read-all
          Method: PUT
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBCrudPolicy:
          TableName: !Ref NotificationsTable
```

### EventBridge Consumer

#### NotificationEventConsumerFunction
```yaml
NotificationEventConsumerFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/handlers/notifications/processEvent.handler
    Timeout: 60
    Events:
      IdeaSubmitted:
        Type: EventBridgeRule
        Properties:
          EventBusName: !Ref IdeationEventBus
          Pattern:
            detail-type: [idea.submitted]
      CampaignActivated:
        Type: EventBridgeRule
        Properties:
          EventBusName: !Ref IdeationEventBus
          Pattern:
            detail-type: [campaign.activated]
      CampaignEvalStarted:
        Type: EventBridgeRule
        Properties:
          EventBusName: !Ref IdeationEventBus
          Pattern:
            detail-type: [campaign.evaluation-started]
      CampaignClosed:
        Type: EventBridgeRule
        Properties:
          EventBusName: !Ref IdeationEventBus
          Pattern:
            detail-type: [campaign.closed]
      EvalAggregationComplete:
        Type: EventBridgeRule
        Properties:
          EventBusName: !Ref IdeationEventBus
          Pattern:
            detail-type: [evaluation.aggregation-complete]
      WinnersAnnounced:
        Type: EventBridgeRule
        Properties:
          EventBusName: !Ref IdeationEventBus
          Pattern:
            detail-type: [recognition.winners-announced]
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBCrudPolicy:
          TableName: !Ref NotificationsTable
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
      - DynamoDBReadPolicy:
          TableName: !Ref CampaignsTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable
```

## IAM Permissions Summary

| Function | Tables | Access |
|---|---|---|
| GetNotifications | Notifications | Read |
| GetUnreadCount | Notifications | Read |
| MarkAsRead | Notifications | Read/Write |
| MarkAllAsRead | Notifications | Read/Write |
| NotificationEventConsumer | Notifications (R/W), Ideas (R), Campaigns (R), Users (R) | Mixed |

## NotificationsTable Key Update

The NotificationsTable was provisioned in Unit 1 with PK: `userId`. Per functional design revision, the sort key should be `notificationId` (ULID).

**Required template.yaml update**:
- Verify NotificationsTable has: PK: `userId`, SK: `notificationId`
