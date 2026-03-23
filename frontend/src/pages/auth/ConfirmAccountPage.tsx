import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authService } from '../../services/authService'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useState } from 'react'

interface ConfirmForm { email: string; confirmationCode: string }

export function ConfirmAccountPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ConfirmForm>({
    defaultValues: { email: searchParams.get('email') ?? '' },
  })

  const onSubmit = async (data: ConfirmForm) => {
    setError(null)
    try {
      await authService.confirmAccount(data.email, data.confirmationCode)
      navigate('/login?confirmed=true')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Confirmation failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Confirm your account</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Enter the confirmation code sent to your email.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input id="email" label="Email" type="email" data-testid="confirm-email-input" error={errors.email?.message}
            {...register('email', { required: 'Email is required' })} />
          <Input id="confirmationCode" label="Confirmation Code" data-testid="confirm-code-input"
            error={errors.confirmationCode?.message}
            {...register('confirmationCode', { required: 'Confirmation code is required' })} />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full" data-testid="confirm-submit-button">
            Confirm account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/login" data-testid="confirm-resend-link" className="text-indigo-600 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
