# Infrastructure Design — Unit 5: Dashboards, Leaderboard & Analytics

## Lambda Function Definitions

### Dashboard Functions

#### GetLeaderboardFunction
```yaml
GetLeaderboardFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/dashboard/getLeaderboard.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable
    Environment:
      Variables:
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        IDEAS_TABLE: !Ref IdeasTable
        USERS_TABLE: !Ref UsersTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /dashboard/leaderboard
          Method: GET
          ApiId: !Ref HttpApi
```

#### GetIdeaDetailFunction
```yaml
GetIdeaDetailFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/dashboard/getIdeaDetail.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable
    Environment:
      Variables:
        IDEAS_TABLE: !Ref IdeasTable
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        USERS_TABLE: !Ref UsersTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /dashboard/ideas/{ideaId}
          Method: GET
          ApiId: !Ref HttpApi
```

#### GetLeaderboardSummaryFunction
```yaml
GetLeaderboardSummaryFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/dashboard/getLeaderboardSummary.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
    Environment:
      Variables:
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /dashboard/summary
          Method: GET
          ApiId: !Ref HttpApi
```

#### SearchIdeasFunction
```yaml
SearchIdeasFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/dashboard/searchIdeas.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable
    Environment:
      Variables:
        IDEAS_TABLE: !Ref IdeasTable
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        USERS_TABLE: !Ref UsersTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /dashboard/search
          Method: GET
          ApiId: !Ref HttpApi
```

### Analytics Functions

#### GetTopIdeasFunction
```yaml
GetTopIdeasFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/analytics/getTopIdeas.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable
    Environment:
      Variables:
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        IDEAS_TABLE: !Ref IdeasTable
        USERS_TABLE: !Ref UsersTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /analytics/top-ideas
          Method: GET
          ApiId: !Ref HttpApi
```

#### GetComparativeAnalysisFunction
```yaml
GetComparativeAnalysisFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/analytics/getComparativeAnalysis.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
    Environment:
      Variables:
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        IDEAS_TABLE: !Ref IdeasTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /analytics/comparative
          Method: GET
          ApiId: !Ref HttpApi
```

#### GetParticipationMetricsFunction
```yaml
GetParticipationMetricsFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/analytics/getParticipationMetrics.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBReadPolicy:
          TableName: !Ref CampaignsTable
    Environment:
      Variables:
        IDEAS_TABLE: !Ref IdeasTable
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        CAMPAIGNS_TABLE: !Ref CampaignsTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /analytics/participation
          Method: GET
          ApiId: !Ref HttpApi
```

#### GetScoreDistributionFunction
```yaml
GetScoreDistributionFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/analytics/getScoreDistribution.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
    Environment:
      Variables:
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /analytics/score-distribution
          Method: GET
          ApiId: !Ref HttpApi
```

#### GetCampaignSummaryFunction
```yaml
GetCampaignSummaryFunction:
  Type: AWS::Serverless::Function
  Properties:
    Handler: src/analytics/getCampaignSummary.handler
    Runtime: nodejs22.x
    Policies:
      - DynamoDBReadPolicy:
          TableName: !Ref CampaignsTable
      - DynamoDBReadPolicy:
          TableName: !Ref AggregatedScoresTable
      - DynamoDBReadPolicy:
          TableName: !Ref IdeasTable
      - DynamoDBReadPolicy:
          TableName: !Ref UsersTable
    Environment:
      Variables:
        CAMPAIGNS_TABLE: !Ref CampaignsTable
        AGGREGATED_SCORES_TABLE: !Ref AggregatedScoresTable
        IDEAS_TABLE: !Ref IdeasTable
        USERS_TABLE: !Ref UsersTable
    Events:
      Api:
        Type: HttpApi
        Properties:
          Path: /analytics/campaign-summary
          Method: GET
          ApiId: !Ref HttpApi
```

## IAM Permissions Summary

| Function | Tables (Read) |
|---|---|
| GetLeaderboard | AggregatedScores, Ideas, Users |
| GetIdeaDetail | Ideas, AggregatedScores, Users |
| GetLeaderboardSummary | AggregatedScores |
| SearchIdeas | Ideas, AggregatedScores, Users |
| GetTopIdeas | AggregatedScores, Ideas, Users |
| GetComparativeAnalysis | AggregatedScores, Ideas |
| GetParticipationMetrics | Ideas, AggregatedScores, Campaigns |
| GetScoreDistribution | AggregatedScores |
| GetCampaignSummary | Campaigns, AggregatedScores, Ideas, Users |

## No New AWS Resources

- No new DynamoDB tables or GSIs
- No new EventBridge rules
- No new S3 buckets
- All functions use existing API Gateway (HttpApi)
- All functions use existing Lambda Authorizer
