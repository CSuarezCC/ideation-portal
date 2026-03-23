# Frontend Components — Unit 7: Recognition System

## WinnersSection (embedded in LeaderboardPage)
- Displayed at the top of the leaderboard when an announced campaign is selected
- Shows Gold/Silver/Bronze cards with idea title, submitter name, composite score, and badge icon
- Only visible when campaign status is ANNOUNCED and winners exist

## WinnersAnnouncementPage (/recognition/:campaignId)
- Dedicated page showing the full winner announcement
- Displays announcement message, published date
- Shows winner cards (Gold, Silver, Bronze) with scores and submitter info
- Accessible to all authenticated users
- Link from leaderboard winners section and from notifications

## AdminAnnounceButton
- Shown on leaderboard page when campaign status is CLOSED (not yet ANNOUNCED)
- Only visible to Admin role
- Clicking triggers POST /recognition/{campaignId}/announce
- After success, page refreshes to show winners

## Badge Indicators
- On leaderboard table rows: small Gold/Silver/Bronze badge icon next to rank # for winning ideas
- On idea detail page: badge banner at top when idea status is WINNER

## Route
- `/recognition/:campaignId` → WinnersAnnouncementPage
