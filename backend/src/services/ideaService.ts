import { ulid } from 'ulid'
import type { Idea } from '../shared/types/index.js'
import { ideaRepository } from '../repositories/ideaRepository.js'
import { campaignRepository } from '../repositories/campaignRepository.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

export const ideaService = {
  async createDraft(body: Record<string, unknown>, submitterId: string): Promise<Idea> {
    const now = new Date().toISOString()
    const idea: Idea = {
      ideaId: ulid(), title: (body.title as string) || '', description: (body.description as string) || '',
      solution: (body.solution as string) || '', benefits: (body.benefits as string) || '',
      categoryIds: (body.categoryIds as string[]) || [], campaignId: '',
      submitterId, status: 'DRAFT', attachments: [], createdAt: now, updatedAt: now,
    }
    await ideaRepository.create(idea)
    return idea
  },

  async submit(idea: Idea, userId: string) {
    const active = await campaignRepository.getActive()
    if (!active) return { error: 'NO_ACTIVE_CAMPAIGN' as const }

    const now = new Date().toISOString()
    await ideaRepository.updateFields(idea.ideaId, { status: 'SUBMITTED', campaignId: active.campaignId, submittedAt: now })
    await publishEvent('IdeaSubmitted', {
      ideaId: idea.ideaId, title: idea.title, submitterId: userId,
      campaignId: active.campaignId, timestamp: now,
    })
    return { campaign: active, submittedAt: now }
  },

  validateForSubmission(idea: Idea): string | null {
    if (!idea.title || idea.title.length < 5) return 'Title must be at least 5 characters'
    if (!idea.description || idea.description.length < 20) return 'Description must be at least 20 characters'
    if (!idea.solution || idea.solution.length < 20) return 'Solution must be at least 20 characters'
    if (!idea.benefits || idea.benefits.length < 10) return 'Benefits must be at least 10 characters'
    if (!idea.categoryIds || idea.categoryIds.length === 0) return 'At least one category is required'
    return null
  },
}
