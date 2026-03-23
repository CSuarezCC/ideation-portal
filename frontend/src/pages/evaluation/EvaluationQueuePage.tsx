import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { evaluationService, type IdeaEvalStatus } from '../../services/evaluationService'
import { campaignService } from '../../services/campaignService'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const FILTERS = ['ALL', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const

export function EvaluationQueuePage() {
  const [ideas, setIdeas] = useState<IdeaEvalStatus[]>([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [campaignId, setCampaignId] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    campaignService.getActive()
      .then((c: { campaignId: string } | null) => { if (c) setCampaignId(c.campaignId) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!campaignId) return
    setLoading(true)
    evaluationService.getIdeasForEvaluation(campaignId)
      .then(setIdeas)
      .finally(() => setLoading(false))
  }, [campaignId])

  const filtered = filter === 'ALL' ? ideas : ideas.filter(i => i.evaluationStatus === filter)

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Evaluation Queue</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f} data-testid={`filter-${f.toLowerCase()}`} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No ideas to evaluate.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map(idea => (
            <div key={idea.ideaId} data-testid={`eval-card-${idea.ideaId}`}
              className="bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer hover:shadow-md"
              onClick={() => navigate(`/evaluation/${idea.ideaId}`)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900 truncate">{idea.title}</h2>
                  <StatusBadge status={idea.evaluationStatus} />
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">{idea.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
