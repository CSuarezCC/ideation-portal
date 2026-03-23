import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ideaService, type Attachment } from '../../services/ideaService'
import { campaignService, type Category } from '../../services/campaignService'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { FileUpload } from '../../components/ui/FileUpload'
import { AutoSaveIndicator } from '../../components/ui/AutoSaveIndicator'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function IdeaSubmitPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [ideaId, setIdeaId] = useState(id || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [solution, setSolution] = useState('')
  const [benefits, setBenefits] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const formData = useCallback(() => ({ title, description, solution, benefits, categoryIds, attachments }), [title, description, solution, benefits, categoryIds, attachments])

  // Load categories + existing draft or create new
  useEffect(() => {
    const init = async () => {
      const cats = await campaignService.listCategories()
      setCategories(cats)
      if (id) {
        const idea = await ideaService.get(id)
        setIdeaId(idea.ideaId); setTitle(idea.title); setDescription(idea.description)
        setSolution(idea.solution); setBenefits(idea.benefits)
        setCategoryIds(idea.categoryIds); setAttachments(idea.attachments)
      } else {
        const draft = await ideaService.createDraft()
        setIdeaId(draft.ideaId)
      }
      setLoading(false)
    }
    init()
  }, [id])

  // Auto-save every 30s
  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      if (!isDirty || !ideaId) return
      try {
        const { savedAt } = await ideaService.autoSave(ideaId, formData())
        setLastSaved(savedAt); setIsDirty(false)
      } catch { /* silent */ }
    }, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [ideaId, isDirty, formData])

  const markDirty = () => setIsDirty(true)

  const handleSubmit = async () => {
    setSubmitting(true); setError('')
    try {
      await ideaService.updateDraft(ideaId, formData())
      await ideaService.submit(ideaId)
      navigate('/ideas/mine')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  const handleUpload = (a: Attachment) => { setAttachments(prev => [...prev, a]); markDirty() }
  const handleRemove = (fileKey: string) => { setAttachments(prev => prev.filter(a => a.fileKey !== fileKey)); markDirty() }

  const toggleCategory = (catId: string) => {
    setCategoryIds(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId])
    markDirty()
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Edit Idea' : 'Submit an Idea'}</h1>
        <AutoSaveIndicator lastSaved={lastSaved} isDirty={isDirty} />
      </div>
      {error && <div data-testid="idea-form-error" className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}
      <div className="space-y-4">
        <Input label="Title" data-testid="idea-title-input" value={title} onChange={e => { setTitle(e.target.value); markDirty() }} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description / Problem Statement</label>
          <textarea data-testid="idea-description-input" value={description} onChange={e => { setDescription(e.target.value); markDirty() }} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" rows={4} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Solution</label>
          <textarea data-testid="idea-solution-input" value={solution} onChange={e => { setSolution(e.target.value); markDirty() }} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" rows={4} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Benefits</label>
          <textarea data-testid="idea-benefits-input" value={benefits} onChange={e => { setBenefits(e.target.value); markDirty() }} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
          <div className="flex flex-wrap gap-2" data-testid="category-selector">
            {categories.map(c => (
              <button key={c.categoryId} type="button" onClick={() => toggleCategory(c.categoryId)}
                className={`px-3 py-1 rounded-full text-sm ${categoryIds.includes(c.categoryId) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                data-testid={`category-option-${c.categoryId}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
          <FileUpload ideaId={ideaId} attachments={attachments} onUpload={handleUpload} onRemove={handleRemove} />
        </div>
        <div className="flex gap-3 pt-4">
          <Button data-testid="submit-idea-button" onClick={handleSubmit} loading={submitting}>Submit Idea</Button>
          <Button data-testid="save-draft-button" variant="secondary" onClick={async () => { await ideaService.updateDraft(ideaId, formData()); setIsDirty(false); setLastSaved(new Date().toISOString()) }}>Save Draft</Button>
          <Button data-testid="cancel-idea-button" variant="secondary" onClick={() => navigate('/ideas/mine')}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}
