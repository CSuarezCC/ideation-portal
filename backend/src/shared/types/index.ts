export type Role = 'EMPLOYEE' | 'PANEL_MEMBER' | 'ADMIN'

export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface User {
  userId: string
  email: string
  name: string
  department?: string
  avatarUrl?: string
  role: Role
  status: UserStatus
  createdAt: string
  updatedAt: string
}

export interface AuthContext {
  userId: string
  email: string
  role: Role
}

export interface TokenSet {
  accessToken: string
  refreshToken: string
  idToken: string
}

export interface ErrorResponse {
  error: string
  code: string
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'EVALUATION' | 'CLOSED' | 'ANNOUNCED'

export interface Campaign {
  campaignId: string
  name: string
  description: string
  submissionStartDate: string
  submissionEndDate: string
  evaluationStartDate: string
  evaluationEndDate: string
  status: CampaignStatus
  panelMemberIds: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface Category {
  categoryId: string
  name: string
  description?: string
  isActive: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CampaignEventPayload {
  campaignId: string
  campaignName: string
  status: CampaignStatus
  panelMemberIds: string[]
  timestamp: string
}

export type IdeaStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'EVALUATED' | 'WINNER'

export interface Attachment {
  fileKey: string
  fileName: string
  fileSize: number
  contentType: string
  uploadedAt: string
}

export interface Idea {
  ideaId: string
  title: string
  description: string
  solution: string
  benefits: string
  categoryIds: string[]
  campaignId: string
  submitterId: string
  status: IdeaStatus
  attachments: Attachment[]
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export type EvaluationStatus = 'DRAFT' | 'SUBMITTED'

export interface Evaluation {
  ideaId: string
  panelMemberId: string
  campaignId: string
  status: EvaluationStatus
  feasibilityScore?: number
  impactScore?: number
  innovationScore?: number
  feasibilityJustification?: string
  impactJustification?: string
  innovationJustification?: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
}

export interface AnonymizedEvaluation {
  evaluatorIndex: number
  feasibilityScore: number
  impactScore: number
  innovationScore: number
  feasibilityJustification: string
  impactJustification: string
  innovationJustification: string
}

export interface AggregatedScore {
  ideaId: string
  campaignId: string
  feasibilityAvg: number
  impactAvg: number
  innovationAvg: number
  compositeScore: number
  totalEvaluations: number
  evaluations: AnonymizedEvaluation[]
  calculatedAt: string
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'ACCOUNT_NOT_CONFIRMED'
  | 'ACCOUNT_DISABLED'
  | 'CAMPAIGN_NOT_FOUND'
  | 'CAMPAIGN_NOT_DRAFT'
  | 'CAMPAIGN_INVALID_TRANSITION'
  | 'CAMPAIGN_ALREADY_ACTIVE'
  | 'CAMPAIGN_NO_PANEL_MEMBERS'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_NAME_EXISTS'
  | 'INVALID_PANEL_MEMBER'
  | 'IDEA_NOT_FOUND'
  | 'IDEA_NOT_DRAFT'
  | 'IDEA_NOT_OWNER'
  | 'IDEA_VALIDATION_ERROR'
  | 'NO_ACTIVE_CAMPAIGN'
  | 'ATTACHMENT_LIMIT_EXCEEDED'
  | 'FILE_TOO_LARGE'
  | 'EVALUATION_NOT_FOUND'
  | 'EVALUATION_ALREADY_SUBMITTED'
  | 'EVALUATION_VALIDATION_ERROR'
  | 'NOT_PANEL_MEMBER'
  | 'CAMPAIGN_NOT_IN_EVALUATION'
  | 'ANALYTICS_ACCESS_DENIED'
  | 'INVALID_DIMENSION'
  | 'INVALID_LIMIT'
  | 'NOTIFICATION_NOT_FOUND'
  | 'RECOGNITION_NOT_FOUND'
  | 'CAMPAIGN_NOT_CLOSED'
  | 'ALREADY_ANNOUNCED'
  | 'INTERNAL_ERROR'

export interface PaginatedResult<T> {
  items: T[]
  total?: number
  nextPageToken?: string
}

// API Gateway HTTP API event authorizer context shape
export interface ApiGatewayAuthorizerContext {
  userId: string
  email: string
  role: Role
}

// ─── Unit 5: Dashboard & Analytics Read Models ─────────────────────────────

export interface LeaderboardEntry {
  ideaId: string
  title: string
  submitterName: string | null
  submitterId: string
  campaignId: string
  categoryIds: string[]
  compositeScore: number | null
  feasibilityAvg: number | null
  impactAvg: number | null
  innovationAvg: number | null
  totalEvaluations: number | null
  submittedAt: string
}

export interface IdeaDetail {
  ideaId: string
  title: string
  description: string
  solution: string
  benefits: string
  categoryIds: string[]
  campaignId: string
  submitterName: string | null
  status: IdeaStatus
  compositeScore: number | null
  feasibilityAvg: number | null
  impactAvg: number | null
  innovationAvg: number | null
  totalEvaluations: number | null
  evaluations: AnonymizedEvaluation[] | null
  submittedAt?: string
}

export interface TopIdea {
  ideaId: string
  title: string
  submitterName: string
  compositeScore: number
  feasibilityAvg: number
  impactAvg: number
  innovationAvg: number
  totalEvaluations: number
}

export interface ParticipationMetrics {
  campaignId: string
  totalIdeasSubmitted: number
  totalIdeasEvaluated: number
  totalIdeasPending: number
  totalPanelMembers: number
  averageCompositeScore: number
}

export interface ScoreBucket {
  rangeLabel: string
  count: number
}

export interface ScoreDistribution {
  campaignId: string
  dimension: string
  buckets: ScoreBucket[]
}

export interface ComparativeIdeaRow {
  ideaId: string
  title: string
  feasibilityAvg: number
  impactAvg: number
  innovationAvg: number
  compositeScore: number
}

export interface CampaignSummaryData {
  campaignId: string
  campaignName: string
  status: CampaignStatus
  participation: ParticipationMetrics
  topIdeas: TopIdea[]
  scoreDistributions: ScoreDistribution[]
}

// ─── Unit 6: Notifications ─────────────────────────────────────────────────

export type NotificationType =
  | 'IDEA_SUBMITTED'
  | 'CAMPAIGN_ACTIVATED'
  | 'CAMPAIGN_EVALUATION_STARTED'
  | 'CAMPAIGN_CLOSED'
  | 'EVALUATION_COMPLETE'
  | 'WINNERS_ANNOUNCED'

export interface Notification {
  userId: string
  notificationId: string
  type: NotificationType
  title: string
  message: string
  resourceId: string
  resourceType: 'idea' | 'campaign' | 'evaluation' | 'recognition'
  isRead: boolean
  createdAt: string
}

// ─── Unit 7: Recognition System ────────────────────────────────────────────

export type BadgeType = 'GOLD' | 'SILVER' | 'BRONZE'

export interface WinnerRecord {
  campaignId: string
  rank: number
  ideaId: string
  submitterId: string
  ideaTitle: string
  submitterName: string
  compositeScore: number
  badgeType: BadgeType
  announcedAt: string | null
  determinedAt: string
}

export interface WinnerAnnouncement {
  campaignId: string
  rank: number // always 0
  campaignName: string
  message: string
  publishedAt: string | null
  createdAt: string
}
