# Performance Test Instructions

## Performance Requirements (from NFR)
- API responses: < 2s (p95)
- Dashboard refresh: < 5s after new evaluation
- Frontend initial load: < 3s
- Concurrent users: 500–5,000

## Approach

Since this is a serverless application (Lambda + DynamoDB on-demand), performance testing focuses on:
1. Cold start latency
2. API response times under load
3. DynamoDB query efficiency
4. Frontend bundle size and load time

## Cold Start Testing

```bash
# Force cold start by updating function config, then invoke
aws lambda invoke --function-name ideation-portal-dev-GetLeaderboardFunction \
  --payload '{}' /dev/null --log-type Tail | jq -r '.LogResult' | base64 -d
```

Check `Init Duration` in CloudWatch logs. Target: < 1s for Node.js 22 Lambda.

## API Load Testing

Use a tool like `artillery` or `k6`:

```bash
npm install -g artillery

# Create test script
cat > load-test.yml << 'EOF'
config:
  target: "{API_URL}"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
  defaults:
    headers:
      Authorization: "Bearer {TOKEN}"
scenarios:
  - name: "Leaderboard"
    flow:
      - get:
          url: "/leaderboard?campaignId={CAMPAIGN_ID}&dimension=composite"
  - name: "Notifications"
    flow:
      - get:
          url: "/notifications/unread-count"
EOF

artillery run load-test.yml
```

## Frontend Performance

```bash
cd frontend
npm run build
# Check bundle size
ls -la dist/assets/*.js
```

Target: Main bundle < 500KB gzipped. Use browser DevTools Lighthouse for load time audit.

## DynamoDB Monitoring

After load tests, check CloudWatch metrics:
- `ConsumedReadCapacityUnits` / `ConsumedWriteCapacityUnits` per table
- `ThrottledRequests` should be 0 (on-demand mode)
- `SuccessfulRequestLatency` should be < 20ms for single-item operations
