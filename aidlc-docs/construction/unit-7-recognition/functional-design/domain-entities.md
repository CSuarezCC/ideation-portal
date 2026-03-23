# Domain Entities — Unit 7: Recognition System

## WinnerRecord

Represents a single winner entry for a campaign.

| Field | Type | Description |
|---|---|---|
| campaignId | string (PK) | Campaign this recognition belongs to |
| ideaId | string (SK) | Winning idea ID |
| rank | number | 1 = Gold, 2 = Silver, 3 = Bronze |
| submitterId | string | Idea submitter's user ID |
| ideaTitle | string | Denormalized idea title |
| submitterName | string | Denormalized submitter name |
| compositeScore | number | Final composite score at time of determination |
| badgeType | BadgeType | 'GOLD' / 'SILVER' / 'BRONZE' |
| announcedAt | string or null | ISO timestamp when announcement was published; null = not yet announced |
| determinedAt | string | ISO timestamp when winner was determined |

## WinnerAnnouncement

Represents the campaign-level announcement record.

| Field | Type | Description |
|---|---|---|
| campaignId | string (PK) | Campaign ID |
| SK | string | Fixed value `ANNOUNCEMENT` |
| campaignName | string | Denormalized campaign name |
| message | string | Auto-generated announcement text |
| publishedAt | string or null | ISO timestamp when published; null = pending |
| createdAt | string | ISO timestamp when record was created |

## Enumerations

### BadgeType
`'GOLD' | 'SILVER' | 'BRONZE'`

### Rank Mapping
| Rank | BadgeType | Label |
|---|---|---|
| 1 | GOLD | Gold |
| 2 | SILVER | Silver |
| 3 | BRONZE | Bronze |
