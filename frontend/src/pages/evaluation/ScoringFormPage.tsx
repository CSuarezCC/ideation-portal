import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { evaluationService, type EvaluationScores } from '../../services/evaluationService'
import { ideaService } from '../../services/ideaService'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const DIMENSIONS = [
  { key: 'feasibility', label: 'Feasibility', scoreKey: 'feasibilityScore', justKey: 'feasibilityJustification' },
  { key: 'impact', label: 'Impact', scoreKey: 'impactScore', justKey: 'impactJustification' },
  { key: 'innovation', label: 'Innovation', scoreKey: 'innovationScore', justKey: 'innovationJustification' },
] as const

export function ScoringFormPage() {
  const { ideaId } = useParams<{ ideaId: string }>()
  const navigate = useNavigate()
  const [idea, setIdea] = useState<any>(null)
  const [scores, setScores] = useState<EvaluationScores>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ideaId) return
    Promise.all([
      ideaService.get(ideaId),
      evaluationService.getMyEvaluation(ideaId),
    ]).then(([i, ev]) => {
      setIdea(i)
      if (ev) {
        setScores(ev)
        if (ev.status === 'SUBMITTED') setIsSubmitted(true)
      }
    }).finally(() => setLoading(false))
  }, [ideaId])

  const updateScore = (key: string, value: unknown) => setScores(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    try { await evaluationService.saveProgress(ideaId!, scores); setError('') }
    catch (err: any) { setError(err.response?.data?.error || 'Save failed') }
  }

  const handleSubmit = async () => {
    if (!confirm('Scores will be locked after submission. Continue?')) return
    setSubmitting(true); setError('')
    try {
      await evaluationService.submit(ideaId!, scores)
      navigate(`/evaluation/${ideaId}/summary`)
    } catch (err: any) { setError(err.response?.data?.error || 'Submission failed') }
    finally { setSubmitting(false) }
  }

  if (loading) return <LoadingSpinner fullPage />
  if (!idea) return <div className="p-8 text-gray-500">Idea not found</div>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Evaluate Idea</h1>

      {/* Idea details (read-only) */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
        <h2 className="font-semibold text-lg">{idea.title}</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{idea.description}</p>
        <p className="text-sm text-gray-700"><span className="font-medium">Solution:</span> {idea.solution}</p>
        <p className="text-sm text-gray-700"><span className="font-medium">Benefits:</span> {idea.benefits}</p>
      </div>

      {error && <div data-testid="eval-form-error" className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}

      {/* Scoring dimensions */}
      <div className="space-y-6">
        {DIMENSIONS.map(d => (
          <div key={d.key} className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">{d.label} (1–10)</label>
            <input type="number" min={1} max={10} disabled={isSubmitted}
              data-testid={`score-${d.key}`}
              value={(scores as any)[d.scoreKey] ?? ''}
              onChange={e => updateScore(d.scoreKey, e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 mb-2" />
            <label className="block text-sm text-gray-600 mb-1">Justification</label>
            <textarea disabled={isSubmitted}
              data-testid={`justification-${d.key}`}
              value={(scores as any)[d.justKey] ?? ''}
              onChange={e => updateScore(d.justKey, e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" rows={3} />
          </div>
        ))}
      </div>

      {!isSubmitted && (
        <div className="flex gap-3 pt-6">
          <Button data-testid="submit-evaluation-button" onClick={handleSubmit} loading={submitting}>Submit Evaluation</Button>
          <Button data-testid="save-progress-button" variant="secondary" onClick={handleSave}>Save Progress</Button>
          <Button data-testid="back-button" variant="secondary" onClick={() => navigate('/evaluation')}>Back</Button>
        </div>
      )}
      {isSubmitted && (
        <div className="pt-6 space-y-2">
          <p className="text-green-600 font-medium">✓ Evaluation submitted and locked.</p>
          <Button data-testid="view-summary-button" onClick={() => navigate(`/evaluation/${ideaId}/summary`)}>View Summary</Button>
        </div>
      )}
    </div>
  )
}
