import type { Evaluation, AggregatedScore, AnonymizedEvaluation } from '../shared/types/index.js'
import { evaluationRepository } from '../repositories/evaluationRepository.js'
import { ideaRepository } from '../repositories/ideaRepository.js'
import { publishEvent } from '../shared/events/eventBridgeClient.js'

function round2(n: number): number { return Math.round(n * 100) / 100 }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const evaluationService = {
  validateScore(score: unknown): boolean {
    return score === undefined || score === null || (typeof score === 'number' && Number.isInteger(score) && score >= 1 && score <= 10)
  },

  validateStrictScores(body: Record<string, unknown>): string | null {
    for (const key of ['feasibilityScore', 'impactScore', 'innovationScore']) {
      const val = body[key]
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 10)
        return `${key} must be integer 1-10`
    }
    for (const key of ['feasibilityJustification', 'impactJustification', 'innovationJustification']) {
      const val = body[key]
      if (typeof val !== 'string' || val.trim().length === 0)
        return `${key} is required`
    }
    return null
  },

  async checkAndAggregate(ideaId: string, campaignId: string, requiredCount: number) {
    const { items: allEvals } = await evaluationRepository.listByIdea(ideaId)
    const submitted = allEvals.filter(e => e.status === 'SUBMITTED')
    if (submitted.length < requiredCount) return

    const now = new Date().toISOString()
    const n = submitted.length
    const feasibilityAvg = round2(submitted.reduce((s, e) => s + e.feasibilityScore!, 0) / n)
    const impactAvg = round2(submitted.reduce((s, e) => s + e.impactScore!, 0) / n)
    const innovationAvg = round2(submitted.reduce((s, e) => s + e.innovationScore!, 0) / n)
    const compositeScore = round2((feasibilityAvg + impactAvg + innovationAvg) / 3)

    const anonymized: AnonymizedEvaluation[] = shuffle(submitted).map((e, i) => ({
      evaluatorIndex: i + 1,
      feasibilityScore: e.feasibilityScore!, impactScore: e.impactScore!, innovationScore: e.innovationScore!,
      feasibilityJustification: e.feasibilityJustification!, impactJustification: e.impactJustification!, innovationJustification: e.innovationJustification!,
    }))

    try {
      await evaluationRepository.saveAggregatedScore({
        ideaId, campaignId, feasibilityAvg, impactAvg, innovationAvg, compositeScore,
        totalEvaluations: n, evaluations: anonymized, calculatedAt: now,
      })
      await ideaRepository.updateStatus(ideaId, 'EVALUATED')
      await publishEvent('EvaluationAggregationComplete', { ideaId, campaignId, compositeScore, timestamp: now })
    } catch (err: any) {
      if (err.name === 'ConditionalCheckFailedException') return
      throw err
    }
  },
}
