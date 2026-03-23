# Functional Design Plan — Unit 5: Dashboards, Leaderboard & Analytics

## Unit Context
- **Unit**: Unit 5 — Dashboards, Leaderboard & Analytics
- **Components**: DashboardComponent, AnalyticsComponent
- **Dependencies**: Unit 1 (auth, RBAC), Unit 3 (ideas), Unit 4 (aggregated scores)
- **Requirements Covered**: FR-06 (Dashboards & Leaderboards), FR-07 (Analytics), NFR-03 (Performance), NFR-07 (Usability)

## Plan Steps

- [x] Step 1: Analyze unit definition, component methods, and dependencies
- [x] Step 2: Collect user answers to clarifying questions
- [x] Step 3: Generate domain-entities.md
- [x] Step 4: Generate business-rules.md
- [x] Step 5: Generate business-logic-model.md
- [x] Step 6: Generate frontend-components.md

## Clarifying Questions

Please answer the following questions to help clarify the functional design.

## Question 1
How should the leaderboard display idea authorship to different roles?

A) All roles see idea author names on the leaderboard (fully attributed)
B) Employees see anonymized ideas (no author names); Panel Members and Admins see author names
C) All roles see anonymized ideas on the leaderboard; author names only visible in idea detail
D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2
What dimensions should the leaderboard support for sorting/ranking?

A) Four tabs: Composite Score, Feasibility, Impact, Innovation (as defined in FR-06)
B) Four tabs plus an additional "Most Recent" or "Most Discussed" tab
C) Single view with a dropdown to switch ranking dimension
D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
Who should have access to the analytics pages (FR-07)?

A) Admin and Panel Members only (as stated in FR-07)
B) All authenticated users (Employees included) with limited analytics
C) Admin only
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
Should dashboards and analytics be scoped to a single campaign at a time, or support cross-campaign views?

A) Single campaign at a time (campaign selector dropdown)
B) Cross-campaign comparison view alongside single-campaign view
C) Default to the most recent campaign, with option to switch
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
For the score distribution charts (FR-07), what visualization approach is preferred?

A) Simple bar charts (lightweight, no charting library dependency)
B) Use a charting library (e.g., Recharts) for richer visualizations (bar, pie, histogram)
C) CSS-only visual indicators (progress bars, colored segments) — zero dependencies
D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 6
Should the leaderboard support pagination, or load all evaluated ideas at once?

A) Paginated (e.g., 20 ideas per page) with load-more or page navigation
B) Load all ideas at once (acceptable given 500-5,000 user scale, likely fewer ideas)
C) Virtual scrolling (load all data, render visible rows only)
D) Other (please describe after [Answer]: tag below)

[Answer]: B
