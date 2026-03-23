import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useState } from 'react'

interface RequestForm { email: string }
interface ResetForm { code: string; newPassword: string; confirmPassword: string }

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const requestForm = useForm<RequestForm>()
  const resetForm = useForm<ResetForm>()

  const onRequestSubmit = async (data: RequestForm) => {
    setError(null)
    try {
      await authService.forgotPassword(data.email)
      setEmail(data.email)
      setStep('reset')
    } catch {
      setError('Request failed. Please try again.')
    }
  }

  const onResetSubmit = async (data: ResetForm) => {
    setError(null)
    try {
      await authService.resetPassword(email, data.code, data.newPassword)
      navigate('/login?reset=true')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Reset failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Reset your password</h1>

        {step === 'request' ? (
          <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4" noValidate>
            <Input id="forgot-email" label="Email" type="email" data-testid="forgot-email-input"
              error={requestForm.formState.errors.email?.message}
              {...requestForm.register('email', { required: 'Email is required' })} />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" isLoading={requestForm.formState.isSubmitting} className="w-full" data-testid="forgot-submit-button">
              Send reset code
            </Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4" noValidate>
            <p className="text-sm text-gray-500">A reset code was sent to <strong>{email}</strong>.</p>
            <Input id="reset-code" label="Reset Code" data-testid="reset-code-input"
              error={resetForm.formState.errors.code?.message}
              {...resetForm.register('code', { required: 'Reset code is required' })} />
            <Input id="reset-password" label="New Password" type="password" data-testid="reset-password-input"
              error={resetForm.formState.errors.newPassword?.message}
              {...resetForm.register('newPassword', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                validate: (v) => (/[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v)) || 'Must include uppercase, lowercase, and a digit',
              })} />
            <Input id="reset-confirm-password" label="Confirm New Password" type="password"
              data-testid="reset-confirm-password-input"
              error={resetForm.formState.errors.confirmPassword?.message}
              {...resetForm.register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === resetForm.watch('newPassword') || 'Passwords do not match',
              })} />
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" isLoading={resetForm.formState.isSubmitting} className="w-full" data-testid="reset-submit-button">
              Reset password
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-600">
          <Link to="/login" className="text-indigo-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
