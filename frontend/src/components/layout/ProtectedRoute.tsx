import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  requiredRole?: 'EMPLOYEE' | 'PANEL_MEMBER' | 'ADMIN'
  children?: ReactNode
}

const ROLE_HIERARCHY = { EMPLOYEE: 1, PANEL_MEMBER: 2, ADMIN: 3 }

export function ProtectedRoute({ requiredRole, children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) return <LoadingSpinner fullPage />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (requiredRole && user) {
    const hasRole = ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole]
    if (!hasRole) return <Navigate to="/dashboard" replace />
  }

  return children ? <>{children}</> : <Outlet />
}
