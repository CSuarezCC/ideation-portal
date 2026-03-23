import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ideaService, type Idea } from '../../services/ideaService'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    ideaService.get(id)
      .then(setIdea)
      .catch(err => setError(err.response?.data?.error || 'Failed to load idea'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner fullPage />
  if (error) return <div className="p-8 text-red-600">{error}</div>
  if (!idea) return <div className="p-8 text-gray-500">Idea not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{idea.title}</h1>
        <StatusBadge status={idea.status} />
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-1">Description / Problem Statement</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{idea.description}</p>
        </section>
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-1">Proposed Solution</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{idea.solution}</p>
        </section>
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase mb-1">Expected Benefits</h2>
          <p className="text-gray-800 whitespace-pre-wrap">{idea.benefits}</p>
        </section>
        {idea.attachments.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase mb-1">Attachments</h2>
            <ul className="space-y-1">
              {idea.attachments.map(a => (
                <li key={a.fileKey} className="text-sm text-indigo-600">{a.fileName} ({(a.fileSize / 1024).toFixed(0)} KB)</li>
              ))}
            </ul>
          </section>
        )}
        <div className="text-xs text-gray-400 border-t pt-3">
          {idea.submittedAt && <span>Submitted: {new Date(idea.submittedAt).toLocaleString()}</span>}
        </div>
      </div>
    </div>
  )
}
