import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { campaignService } from '../../../services/campaignService'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

interface CampaignForm {
  name: string
  description: string
  submissionStartDate: string
  submissionEndDate: string
  evaluationStartDate: string
  evaluationEndDate: string
}

export function CampaignFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CampaignForm>()

  useEffect(() => {
    if (id) {
      campaignService.get(id).then(c => {
        if (c.status !== 'DRAFT') { navigate(`/admin/campaigns/${id}`); return }
        reset({
          name: c.name, description: c.description,
          submissionStartDate: c.submissionStartDate.slice(0, 16),
          submissionEndDate: c.submissionEndDate.slice(0, 16),
          evaluationStartDate: c.evaluationStartDate.slice(0, 16),
          evaluationEndDate: c.evaluationEndDate.slice(0, 16),
        })
        setLoading(false)
      })
    }
  }, [id, navigate, reset])

  const onSubmit = async (data: CampaignForm) => {
    setSubmitting(true)
    setError('')
    const payload = {
      ...data,
      submissionStartDate: new Date(data.submissionStartDate).toISOString(),
      submissionEndDate: new Date(data.submissionEndDate).toISOString(),
      evaluationStartDate: new Date(data.evaluationStartDate).toISOString(),
      evaluationEndDate: new Date(data.evaluationEndDate).toISOString(),
    }
    try {
      const result = isEdit ? await campaignService.update(id!, payload) : await campaignService.create(payload)
      navigate(`/admin/campaigns/${result.campaignId}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save campaign')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isEdit ? 'Edit Campaign' : 'Create Campaign'}</h1>
      {error && <div data-testid="campaign-form-error" className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" data-testid="campaign-name-input" {...register('name', { required: 'Required', minLength: { value: 3, message: 'Min 3 chars' }, maxLength: { value: 200, message: 'Max 200 chars' } })} error={errors.name?.message} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea data-testid="campaign-description-input" {...register('description', { required: 'Required', minLength: { value: 10, message: 'Min 10 chars' } })} className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" rows={3} />
          {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Submission Start" type="datetime-local" data-testid="submission-start-input" {...register('submissionStartDate', { required: 'Required' })} error={errors.submissionStartDate?.message} />
          <Input label="Submission End" type="datetime-local" data-testid="submission-end-input" {...register('submissionEndDate', { required: 'Required' })} error={errors.submissionEndDate?.message} />
          <Input label="Evaluation Start" type="datetime-local" data-testid="evaluation-start-input" {...register('evaluationStartDate', { required: 'Required' })} error={errors.evaluationStartDate?.message} />
          <Input label="Evaluation End" type="datetime-local" data-testid="evaluation-end-input" {...register('evaluationEndDate', { required: 'Required' })} error={errors.evaluationEndDate?.message} />
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" data-testid="campaign-form-submit" loading={submitting}>{isEdit ? 'Update' : 'Create'}</Button>
          <Button type="button" data-testid="campaign-form-cancel" variant="secondary" onClick={() => navigate('/admin/campaigns')}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
