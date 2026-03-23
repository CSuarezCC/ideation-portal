# Code Generation Plan — Unit 7: Recognition System

## Steps

- [x] Step 1: Shared types — Add WinnerRecord, WinnerAnnouncement, BadgeType + new error codes (RECOGNITION_NOT_FOUND, CAMPAIGN_NOT_CLOSED, ALREADY_ANNOUNCED)
- [x] Step 2: Backend — processWinners handler (EventBridge consumer: campaign.closed → determine top 3, write to WinnersTable)
- [x] Step 3: Backend — getWinners handler (GET /recognition/{campaignId}/winners)
- [x] Step 4: Backend — getAnnouncement handler (GET /recognition/{campaignId}/announcement)
- [x] Step 5: Backend — announceWinners handler (POST /recognition/{campaignId}/announce — Admin only)
- [x] Step 6: Backend — Update Unit 6 processEvent placeholder (recognition.winners-announced → real notifications)
- [x] Step 7: SAM template.yaml — Add 4 Lambda functions (1 EventBridge consumer + 3 API)
- [x] Step 8: Frontend — recognitionService.ts (API client)
- [x] Step 9: Frontend — WinnersAnnouncementPage (/recognition/:campaignId)
- [x] Step 10: Frontend — Update LeaderboardPage (WinnersSection + AdminAnnounceButton + badge indicators)
- [x] Step 11: Frontend — Router update (App.tsx — add /recognition/:campaignId route)
- [x] Step 12: Code Summary Documentation
