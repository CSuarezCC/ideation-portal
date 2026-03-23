# Infrastructure Design — Unit 7: Recognition System

## Existing Table: WinnersTable

Already provisioned in template.yaml with PK=`campaignId` (S), SK=`rank` (N).

**Design adaptation**: Use rank=0 for the announcement record, ranks 1-3 for winners.

| Record Type | campaignId | rank | Description |
|---|---|---|---|
| Announcement | {campaignId} | 0 | Campaign announcement metadata |
| Gold winner | {campaignId} | 1 | 1st place winner |
| Silver winner | {campaignId} | 2 | 2nd place winner |
| Bronze winner | {campaignId} | 3 | 3rd place winner |

## Lambda Function Definitions

### EventBridge Consumer

#### ProcessWinnersFunction
```yaml
ProcessWinnersFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/recognition/processWinners.handler
    Timeout: 30
    Events:
      CampaignClosed:
        Type: EventBridgeRule
        Properties:
          EventBusName: !Ref IdeationEventBus
          Pattern:
            detail-type: [campaign.closed]
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBCrudPolicy:
          TableName: !Ref WinnersTable
```

### API Functions

#### GetWinnersFunction
```yaml
GetWinnersFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/recognition/getWinners.handler
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /recognition/{campaignId}/winners
          Method: GET
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBReadPolicy:
          TableName: !Ref WinnersTable
```

#### GetAnnouncementFunction
```yaml
GetAnnouncementFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/recognition/getAnnouncement.handler
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /recognition/{campaignId}/announcement
          Method: GET
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBReadPolicy:
          TableName: !Ref WinnersTable
```

#### AnnounceWinnersFunction
```yaml
AnnounceWinnersFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/recognition/announceWinners.handler
    Timeout: 30
    Events:
      Api:
        Type: HttpApi
        Properties:
          ApiId: !Ref HttpApi
          Path: /recognition/{campaignId}/announce
          Method: POST
    Policies:
      - AWSLambdaBasicExecutionRole
      - DynamoDBCrudPolicy:
          TableName: !Ref WinnersTable
      - DynamoDBCrudPolicy:
          TableName: !Ref CampaignsTable
      - DynamoDBCrudPolicy:
          TableName: !Ref IdeasTable
      - Statement:
          - Effect: Allow
            Action: events:PutEvents
            Resource: !GetAtt IdeationEventBus.Arn
```

## IAM Permissions Summary

| Function | Tables/Resources | Access |
|---|---|---|
| ProcessWinners | AggregatedScores (R), Winners (R/W) | Mixed |
| GetWinners | Winners (R) | Read |
| GetAnnouncement | Winners (R) | Read |
| AnnounceWinners | Winners (R/W), Campaigns (R/W), Ideas (R/W), EventBridge (Publish) | Mixed |
