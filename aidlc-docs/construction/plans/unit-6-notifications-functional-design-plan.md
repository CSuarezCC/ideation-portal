# Functional Design Plan — Unit 6: Notifications

## Unit Context
- **Unit**: Unit 6 — Notifications
- **Components**: NotificationComponent (API + EventBridge Consumer)
- **Dependencies**: Unit 1 (auth), EventBridge events from Units 2, 3, 4, 7
- **Requirements Covered**: FR-09 (In-Portal Notifications)

## Plan Steps

- [x] Step 1: Analyze unit definition, component methods, and event sources
- [x] Step 2: Collect user answers to clarifying questions
- [x] Step 3: Generate domain-entities.md
- [x] Step 4: Generate business-rules.md
- [x] Step 5: Generate business-logic-model.md
- [x] Step 6: Generate frontend-components.md

## Clarifying Questions

Please answer the following questions to help clarify the functional design.

## Question 1
How should notifications be paginated when fetched?

A) Cursor-based pagination (nextPageToken) — efficient for "load more" pattern
B) Offset-based pagination (page number + page size)
C) Load all notifications at once (acceptable for in-portal notifications)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
Should notifications have different priority levels (e.g., normal vs. urgent for winner announcements)?

A) No — all notifications are equal, displayed in chronological order
B) Yes — two levels: normal and important (important shown with visual emphasis)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
How should the notification consumer handle events from Unit 7 (Recognition) which hasn't been built yet?

A) Implement the event handler now with the expected event schema — it will work once Unit 7 publishes events
B) Add a placeholder handler that logs the event — implement fully when Unit 7 is built
C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
Should old notifications be automatically cleaned up after a certain period?

A) No — retain all notifications indefinitely
B) Yes — auto-delete notifications older than 90 days
C) Yes — auto-delete read notifications older than 30 days, keep unread indefinitely
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
When a campaign status changes, who should be notified?

A) All users (everyone sees campaign lifecycle changes)
B) Only users who submitted ideas to that campaign + assigned panel members + admins
C) Only assigned panel members + admins
D) Other (please describe after [Answer]: tag below)

[Answer]: B
