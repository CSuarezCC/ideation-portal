# Functional Design Plan — Unit 7: Recognition System

## Unit Context
- **Unit**: Unit 7 — Recognition System
- **Components**: RecognitionComponent (EventBridge Consumer + API)
- **Dependencies**: Unit 1 (auth), Unit 4 (aggregated scores), Unit 6 (notifications — publishes recognition.winners-announced)
- **Requirements Covered**: FR-08 (Recognition System)

## Plan Steps

- [x] Step 1: Analyze unit definition, component methods, and event triggers
- [x] Step 2: Collect user answers to clarifying questions
- [x] Step 3: Generate domain-entities.md
- [x] Step 4: Generate business-rules.md
- [x] Step 5: Generate business-logic-model.md
- [x] Step 6: Generate frontend-components.md

## Clarifying Questions

Please answer the following questions to help clarify the functional design.

## Question 1
Should the recognition workflow be triggered automatically when a campaign closes, or should an Admin manually trigger it?

A) Automatic — triggered by campaign.closed EventBridge event (no manual step)
B) Semi-automatic — campaign.closed event queues it, but Admin must confirm/approve winners before announcement
C) Manual — Admin clicks a button to trigger winner determination after campaign closes
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
How should ties be handled when determining top 3 winners?

A) Strict top 3 by composite score — ties broken by feasibility, then impact, then innovation (same as leaderboard)
B) If tied for 3rd place, include all tied ideas (could result in more than 3 winners)
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
Should winner badges be visible on the leaderboard and idea detail pages immediately, or only after a formal announcement?

A) Immediately after determination — idea status changes to WINNER and badge appears everywhere
B) Only after announcement — winners are determined but hidden until Admin publishes the announcement
C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
Where should the winners announcement page be accessible from?

A) Dedicated /recognition route visible to all users + link from leaderboard
B) Embedded within the leaderboard page as a highlighted section at the top
C) Both — dedicated page + highlighted section on leaderboard
D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5
Should the recognition system update the notification consumer placeholder (Unit 6) to send actual winner notifications?

A) Yes — update the processEvent handler to create notifications for winners and admins
B) No — leave as placeholder, handle in a future iteration
C) Other (please describe after [Answer]: tag below)

[Answer]: A
