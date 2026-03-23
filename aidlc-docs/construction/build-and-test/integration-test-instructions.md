# Integration Test Instructions

## Purpose
Test interactions between units/services to ensure the full system works end-to-end after deployment.

## Prerequisites
- Backend deployed via `sam deploy`
- Frontend configured with correct API URL
- At least one Admin user created in Cognito

## Test Scenarios

### Scenario 1: Campaign Lifecycle (Units 1-2-3-4-7)
1. Login as Admin
2. Create a campaign with submission and evaluation dates
3. Assign panel members to the campaign
4. Transition campaign to ACTIVE
5. Login as Employee, submit an idea
6. Verify `idea.submitted` notification appears (Unit 6)
7. Login as Panel Member, score the idea
8. Transition campaign to EVALUATION, then CLOSED
9. Verify `campaign.closed` triggers winner determination (Unit 7 — check WinnersTable)
10. Login as Admin, call POST /recognition/{campaignId}/announce
11. Verify campaign status is ANNOUNCED, idea status is WINNER
12. Verify winner notifications sent to submitter and admins (Unit 6)

### Scenario 2: Notification Flow (Units 3-6)
1. Submit an idea as Employee
2. Verify GET /notifications returns IDEA_SUBMITTED notification
3. Verify GET /notifications/unread-count returns 1
4. Call PUT /notifications/{id}/read
5. Verify unread count is now 0

### Scenario 3: Dashboard & Analytics (Units 4-5)
1. With evaluated ideas in a campaign, verify GET /leaderboard returns ranked entries
2. Verify GET /analytics/top-ideas returns top ideas with scores
3. Verify GET /analytics/participation returns correct metrics

### Scenario 4: Recognition Display (Units 5-7)
1. After announcing winners, verify GET /recognition/{campaignId}/winners returns 3 winners
2. Verify GET /recognition/{campaignId}/announcement returns published announcement
3. Verify leaderboard shows badge indicators for winning ideas

## Local Testing with SAM

### Start Local API
```bash
sam local start-api --env-vars env.json
```

Create `env.json` with table names pointing to deployed DynamoDB tables:
```json
{
  "Parameters": {
    "USERS_TABLE": "ideation-portal-users-dev",
    "CAMPAIGNS_TABLE": "ideation-portal-campaigns-dev",
    "IDEAS_TABLE": "ideation-portal-ideas-dev",
    "EVALUATIONS_TABLE": "ideation-portal-evaluations-dev",
    "AGGREGATED_SCORES_TABLE": "ideation-portal-aggregated-scores-dev",
    "NOTIFICATIONS_TABLE": "ideation-portal-notifications-dev",
    "WINNERS_TABLE": "ideation-portal-winners-dev"
  }
}
```

## Manual API Testing

Use curl or a tool like Postman/Insomnia:

```bash
# Get auth token
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -d '{"email":"admin@example.com","password":"..."}' | jq -r '.accessToken')

# Test recognition endpoints
curl -H "Authorization: Bearer $TOKEN" $API_URL/recognition/{campaignId}/winners
curl -H "Authorization: Bearer $TOKEN" -X POST $API_URL/recognition/{campaignId}/announce
```
