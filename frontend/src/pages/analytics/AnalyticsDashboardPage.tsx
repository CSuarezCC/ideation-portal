import { useEffect, useState } from 'react'
import { analyticsService, type CampaignSummaryData, type ComparativeIdeaRow } from '../../services/analyticsService'
import { CampaignSelector } from '../../components/ui/CampaignSelector'
import { ScoreBarChart } from '../../components/ui/ScoreBarChart'
import { ComparativeChart } from '../../components/ui/ComparativeChart'
import { ScoreDisplay } from '../../components/ui/ScoreDisplay'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const DIST_COLORS: Record<string, string> = { composite: '#6366f1', feasibility: '#3b82f6', impact: '#10b981', innovation: '#f59e0b' }

export function AnalyticsDashboardPage() {
  const [campaignId, setCampaignId] = useState('')
  const [summary, setSummary] = useState<CampaignSummaryData | null>(null)
  const [comparative, setComparative] = useState<ComparativeIdeaRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!campaignId) return
    setLoading(true)
    Promise.all([
      analyticsService.getCampaignSummary(campaignId),
      analyticsService.getComparative(campaignId).then(r => r.ideas),
    ]).then(([s, c]) => { setSummary(s); setComparative(c) })
      .finally(() => setLoading(false))
  }, [campaignId])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <CampaignSelector selectedCampaignId={campaignId} onCampaignChange={setCampaignId} />
      </div>

      {loading ? <LoadingSpinner fullPage /> : !summary ? (
        <p className="text-gray-500">Select a campaign to view analytics.</p>
      ) : (
        <div className="space-y-6">
          {/* Campaign Summary Card */}
          <div className="bg-white p-4 rounded-lg shadow" data-testid="campaign-summary-card">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">{summary.campaignName}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{summary.status}</span>
          </div>

          {/* Participation Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="participation-metrics">
            {[
              { label: 'Submitted', value: summary.participation.totalIdeasSubmitted },
              { label: 'Evaluated', value: summary.participation.totalIdeasEvaluated },
              { label: 'Pending', value: summary.participation.totalIdeasPending },
              { label: 'Panel Members', value: summary.participation.totalPanelMembers },
              { label: 'Avg Score', value: summary.participation.averageCompositeScore.toFixed(1) },
            ].map(m => (
              <div key={m.label} className="bg-white p-3 rounded-lg shadow text-center">
                <p className="text-2xl font-bold text-indigo-600">{m.value}</p>
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Top Ideas */}
          <div className="bg-white p-4 rounded-lg shadow" data-testid="top-ideas-section">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Top Ideas</h2>
            <div className="space-y-2">
              {summary.topIdeas.map((idea, idx) => (
                <div key={idea.ideaId} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-6">{idx + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{idea.title}</p>
                      <p className="text-xs text-gray-500">by {idea.submitterName}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <ScoreDisplay label="Comp" value={idea.compositeScore} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Distributions */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Score Distributions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.scoreDistributions.map(dist => (
                <ScoreBarChart key={dist.dimension} data={dist.buckets}
                  title={dist.dimension.charAt(0).toUpperCase() + dist.dimension.slice(1)}
                  color={DIST_COLORS[dist.dimension]} />
              ))}
            </div>
          </div>

          {/* Comparative Analysis */}
          {comparative.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Comparative Analysis</h2>
              <ComparativeChart data={comparative} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
