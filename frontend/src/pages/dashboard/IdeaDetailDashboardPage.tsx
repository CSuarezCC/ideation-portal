import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { dashboardService, type IdeaDetail } from '../../services/dashboardService'
import { ScoreDisplay } from '../../components/ui/ScoreDisplay'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function IdeaDetailDashboardPage() {
  const { ideaId } = useParams<{ ideaId: string }>()
  const [idea, setIdea] = useState<IdeaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!ideaId) return
    dashboardService.getIdeaDetail(ideaId).then(setIdea).finally(() => setLoading(false))
  }, [ideaId])

  if (loading) return <LoadingSpinner fullPage />
  if (!idea) return <p className="text-gray-500 p-8">Idea not found.</p>

  return (
    <div>
      <button data-testid="back-to-leaderboard" onClick={() => navigate('/leaderboard')}
        className="text-indigo-600 text-sm mb-4 hover:underline">← Back to Leaderboard</button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{idea.title}</h1>
      {idea.submitterName && <p className="text-sm text-gray-500 mb-4">by {idea.submitterName}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
          <p className="text-sm text-gray-600">{idea.description}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Proposed Solution</h2>
          <p className="text-sm text-gray-600">{idea.solution}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Expected Benefits</h2>
          <p className="text-sm text-gray-600">{idea.benefits}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Scores</h2>
          {idea.compositeScore != null ? (
            <div className="space-y-2">
              <ScoreDisplay label="Composite" value={idea.compositeScore} />
              <ScoreDisplay label="Feasibility" value={idea.feasibilityAvg!} />
              <ScoreDisplay label="Impact" value={idea.impactAvg!} />
              <ScoreDisplay label="Innovation" value={idea.innovationAvg!} />
              <p className="text-xs text-gray-400 mt-1">{idea.totalEvaluations} evaluations</p>
            </div>
          ) : <p className="text-sm text-gray-400">Not yet evaluated</p>}
        </div>
      </div>

      {idea.evaluations && idea.evaluations.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Individual Evaluations (Anonymized)</h2>
          <table className="min-w-full divide-y divide-gray-200" data-testid="evaluations-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Evaluator</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Feasibility</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Impact</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Innovation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {idea.evaluations.map(ev => (
                <tr key={ev.evaluatorIndex}>
                  <td className="px-3 py-2 text-sm text-gray-600">Evaluator {ev.evaluatorIndex}</td>
                  <td className="px-3 py-2 text-sm text-right">{ev.feasibilityScore}</td>
                  <td className="px-3 py-2 text-sm text-right">{ev.impactScore}</td>
                  <td className="px-3 py-2 text-sm text-right">{ev.innovationScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
