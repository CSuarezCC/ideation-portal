import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  size?: string
}

const VARIANTS = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300',
  secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
}

export function Button({ isLoading, loading, variant = 'primary', size: _size, children, className = '', disabled, ...props }: ButtonProps) {
  const busy = isLoading || loading
  return (
    <button
      {...props}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {busy && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
