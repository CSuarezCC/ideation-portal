import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useState } from 'react'

interface LoginForm { email: string; password: string }

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setError(null)
    try {
      await login(data.email, data.password)
      navigate(searchParams.get('redirect') ?? '/dashboard', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error ?? 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign in to Ideation Portal</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            data-testid="login-email-input"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
            })}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            data-testid="login-password-input"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          {error && (
            <p data-testid="login-error-message" className="text-sm text-red-600" role="alert">{error}</p>
          )}
          <Button type="submit" isLoading={isSubmitting} className="w-full" data-testid="login-submit-button">
            Sign in
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-600 space-y-1">
          <p><Link to="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link></p>
          <p>No account? <Link to="/register" className="text-indigo-600 hover:underline">Register</Link></p>
        </div>
      </div>
    </div>
  )
}
