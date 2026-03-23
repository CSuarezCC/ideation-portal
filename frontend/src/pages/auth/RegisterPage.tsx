import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useState } from 'react'

interface RegisterForm {
  name: string
  email: string
  department: string
  password: string
  confirmPassword: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>()

  const onSubmit = async (data: RegisterForm) => {
    setError(null)
    try {
      await authService.register(data.email, data.password, data.name, data.department || undefined)
      navigate(`/confirm-account?email=${encodeURIComponent(data.email)}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create your account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input id="name" label="Full Name" data-testid="register-name-input" error={errors.name?.message}
            {...register('name', { required: 'Name is required' })} />
          <Input id="email" label="Email" type="email" data-testid="register-email-input" error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
            })} />
          <Input id="department" label="Department (optional)" data-testid="register-department-input"
            {...register('department')} />
          <Input id="password" label="Password" type="password" data-testid="register-password-input" error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'At least 8 characters' },
              validate: (v) =>
                (/[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v)) ||
                'Must include uppercase, lowercase, and a digit',
            })} />
          <Input id="confirmPassword" label="Confirm Password" type="password" data-testid="register-confirm-password-input"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })} />
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full" data-testid="register-submit-button">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
