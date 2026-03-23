# Business Rules — Unit 7: Recognition System

## BR-01: Automatic Winner Determination
- Winner determination is triggered automatically by the `campaign.closed` EventBridge event.
- No manual Admin intervention is required to determine winners.

## BR-02: Top 3 Selection
- The system selects the top 3 ideas by composite score from the AggregatedScoresTable for the campaign.
- Ties are broken by: feasibilityAvg (desc) → impactAvg (desc) → innovationAvg (desc).
- Exactly 3 winners are selected (strict top 3). If fewer than 3 evaluated ideas exist, only those are recognized.

## BR-03: Badge Assignment
- Rank 1 → GOLD, Rank 2 → SILVER, Rank 3 → BRONZE.
- Badges are stored in the WinnerRecord and denormalized onto the idea's status field (WINNER).

## BR-04: Deferred Announcement (Answer: B)
- Winners are determined immediately on campaign.closed but NOT publicly visible.
- `announcedAt` is null until Admin publishes the announcement.
- The campaign status transitions from CLOSED → ANNOUNCED when the Admin publishes.
- Only after announcement: idea status changes to WINNER, badges appear on leaderboard, and notifications are sent.

## BR-05: Announcement Publishing
- Admin calls `POST /recognition/{campaignId}/announce` to publish.
- This sets `announcedAt` on all WinnerRecords and the WinnerAnnouncement.
- Updates campaign status to ANNOUNCED.
- Updates winning ideas' status to WINNER.
- Publishes `recognition.winners-announced` EventBridge event (triggers notifications).

## BR-06: Notification on Announcement
- When `recognition.winners-announced` fires, the notification consumer (Unit 6) creates:
  - One notification per winner (submitter) with their rank and badge info.
  - One notification to all Admin users for HR follow-up.

## BR-07: Leaderboard Integration
- After announcement, the leaderboard highlights top 3 with Gold/Silver/Bronze badges.
- Winner badge is visible on leaderboard rows and idea detail pages.

## BR-08: Idempotency
- If `campaign.closed` fires multiple times, the system checks if winners already exist for that campaign and skips re-determination.
