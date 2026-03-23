import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { evaluationService } from '../../services/evaluationService'
import { ScoreDisplay } from '../../components/ui/ScoreDisplay'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function EvaluationSummaryPage() {
  const { ideaId } = useParams<{ ideaId: string }>()
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ideaId) return
    evaluationService.getSummary(ideaId)
      .then(setSummary)
      .finally(() => setLoading(false))
  }, [ideaId])

  if (loading) return <LoadingSpinner fullPage />
  if (!summary) return <div className="p-8 text-gray-500">No summary available</div>

  if (summary.status === 'PENDING') return <div className="p-8 text-gray-500">Evaluation not yet complete. Waiting for all panel members to score.</div>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Evaluation Summary</h1>

      {/* Aggregated averages */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase mb-3">Aggregated Scores</h2>
        <div className="space-y-2">
          <ScoreDisplay label="Feasibility" value={summary.feasibilityAvg} />
          <ScoreDisplay label="Impact" value={summary.impactAvg} />
          <ScoreDisplay label="Innovation" value={summary.innovationAvg} />
          <div className="border-t pt-2 mt-2">
            <ScoreDisplay label="Composite" value={summary.compositeScore} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Based on {summary.totalEvaluations} evaluations</p>
      </div>

      {/* Blind scoring notice or individual breakdowns */}
      {summary.status === 'BLIND' ? (
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
          Submit your evaluation to see individual score breakdowns.
        </div>
      ) : (
        summary.evaluations && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-500 uppercase">Individual Evaluations (Anonymized)</h2>
            {summary.evaluations.map((ev: any) => (
              <div key={ev.evaluatorIndex} className="bg-white rounded-lg shadow p-4" data-testid={`evaluator-${ev.evaluatorIndex}`}>
                <h3 className="font-semibold text-gray-800 mb-2">Panel Member {ev.evaluatorIndex}</h3>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <ScoreDisplay label="Feasibility" value={ev.feasibilityScore} />
                  <ScoreDisplay label="Impact" value={ev.impactScore} />
                  <ScoreDisplay label="Innovation" value={ev.innovationScore} />
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Feasibility:</span> {ev.feasibilityJustification}</p>
                  <p><span className="font-medium">Impact:</span> {ev.impactJustification}</p>
                  <p><span className="font-medium">Innovation:</span> {ev.innovationJustification}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
