import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { authService } from '../services/authService'

interface AuthUser {
  userId: string
  email: string
  name: string
  role: 'EMPLOYEE' | 'PANEL_MEMBER' | 'ADMIN'
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseJwt(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('idToken')
    setUser(null)
    window.location.href = '/login'
  }, [])

  const loadUserFromToken = useCallback((idToken: string) => {
    try {
      const claims = parseJwt(idToken)
      setUser({
        userId: claims.sub as string,
        email: claims.email as string,
        name: (claims.name as string) ?? '',
        role: (claims['custom:role'] as AuthUser['role']) ?? 'EMPLOYEE',
      })
    } catch {
      logout()
    }
  }, [logout])

  useEffect(() => {
    const idToken = localStorage.getItem('idToken')
    const accessToken = localStorage.getItem('accessToken')
    if (idToken && accessToken) {
      // Check expiry
      try {
        const claims = parseJwt(accessToken)
        const exp = (claims.exp as number) * 1000
        if (Date.now() < exp) {
          loadUserFromToken(idToken)
        } else {
          logout()
        }
      } catch {
        logout()
      }
    }
    setIsLoading(false)
  }, [loadUserFromToken, logout])

  const login = async (email: string, password: string) => {
    const tokens = await authService.login(email, password)
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    localStorage.setItem('idToken', tokens.idToken)
    loadUserFromToken(tokens.idToken)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Export context for testing
export { AuthContext }

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
