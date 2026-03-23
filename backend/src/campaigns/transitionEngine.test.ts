import { checkAndTransition } from './transitionEngine'
import type { Campaign } from '../shared/types/index'

// Mock dependencies
jest.mock('../shared/db/dynamoClient', () => ({
  db: { send: jest.fn() },
  dbQuery: jest.fn().mockResolvedValue({ items: [] }),
}))
jest.mock('../shared/events/eventBridgeClient', () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}))
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  UpdateCommand: jest.fn(),
}))

const { db, dbQuery } = require('../shared/db/dynamoClient')
const { publishEvent } = require('../shared/events/eventBridgeClient')

process.env.CAMPAIGNS_TABLE = 'test-campaigns'

const baseCampaign: Campaign = {
  campaignId: 'camp-1',
  name: 'Test Campaign',
  description: 'Test',
  submissionStartDate: '2025-01-01T00:00:00Z',
  submissionEndDate: '2099-02-01T00:00:00Z',
  evaluationStartDate: '2099-02-01T00:00:00Z',
  evaluationEndDate: '2099-03-01T00:00:00Z',
  status: 'DRAFT',
  panelMemberIds: [],
  createdBy: 'admin-1',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

describe('checkAndTransition', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns campaign unchanged if no transition warranted', async () => {
    const future = { ...baseCampaign, submissionStartDate: '2099-01-01T00:00:00Z' }
    const result = await checkAndTransition(future)
    expect(result.status).toBe('DRAFT')
    expect(db.send).not.toHaveBeenCalled()
  })

  it('returns campaign unchanged for CLOSED status (no further auto-transition)', async () => {
    const closed = { ...baseCampaign, status: 'CLOSED' as const }
    const result = await checkAndTransition(closed)
    expect(result.status).toBe('CLOSED')
  })

  it('returns campaign unchanged for ANNOUNCED status', async () => {
    const announced = { ...baseCampaign, status: 'ANNOUNCED' as const }
    const result = await checkAndTransition(announced)
    expect(result.status).toBe('ANNOUNCED')
  })

  it('transitions DRAFT to ACTIVE when submissionStartDate has passed', async () => {
    db.send.mockResolvedValue({})
    dbQuery.mockResolvedValue({ items: [] })

    const result = await checkAndTransition(baseCampaign)
    expect(result.status).toBe('ACTIVE')
    expect(publishEvent).toHaveBeenCalledWith('CampaignActivated', expect.objectContaining({ campaignId: 'camp-1' }))
  })

  it('skips DRAFT→ACTIVE if another campaign is already ACTIVE', async () => {
    dbQuery.mockResolvedValue({ items: [{ campaignId: 'other-camp', status: 'ACTIVE' }] })

    const result = await checkAndTransition(baseCampaign)
    expect(result.status).toBe('DRAFT')
    expect(db.send).not.toHaveBeenCalled()
  })
})
