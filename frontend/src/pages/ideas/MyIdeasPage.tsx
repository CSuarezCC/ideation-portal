import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ideaService, type Idea } from '../../services/ideaService'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'EVALUATED', 'WINNER'] as const

export function MyIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    ideaService.getMyIdeas(statusFilter === 'ALL' ? undefined : statusFilter)
      .then(setIdeas)
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleDelete = async (ideaId: string) => {
    if (!confirm('Delete this draft?')) return
    await ideaService.deleteDraft(ideaId)
    setIdeas(prev => prev.filter(i => i.ideaId !== ideaId))
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Ideas</h1>
        <Button data-testid="new-idea-button" onClick={() => navigate('/ideas/submit')}>New Idea</Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button key={s} data-testid={`filter-${s.toLowerCase()}`} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {ideas.length === 0 ? (
        <p className="text-gray-500">No ideas found.</p>
      ) : (
        <div className="grid gap-3">
          {ideas.map(idea => (
            <div key={idea.ideaId} data-testid={`idea-card-${idea.ideaId}`} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(idea.status === 'DRAFT' ? `/ideas/${idea.ideaId}/edit` : `/ideas/${idea.ideaId}`)}>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-gray-900 truncate">{idea.title || 'Untitled Draft'}</h2>
                  <StatusBadge status={idea.status} />
                </div>
                <p className="text-sm text-gray-500 truncate mt-1">{idea.description || 'No description'}</p>
              </div>
              {idea.status === 'DRAFT' && (
                <button data-testid={`delete-idea-${idea.ideaId}`} onClick={() => handleDelete(idea.ideaId)} className="text-red-500 text-sm hover:text-red-700 ml-3">Delete</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
