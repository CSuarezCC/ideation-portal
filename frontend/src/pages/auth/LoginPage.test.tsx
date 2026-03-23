import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { LoginPage } from './LoginPage'
import { AuthContext } from '../../context/AuthContext'

const mockLogin = vi.fn()
const mockContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: vi.fn(),
}

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={mockContextValue}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('LoginPage', () => {
  it('renders email and password inputs', () => {
    renderLoginPage()
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit-button')).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    renderLoginPage()
    fireEvent.click(screen.getByTestId('login-submit-button'))
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
    })
  })

  it('calls login with correct credentials', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLoginPage()
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'Password1' } })
    fireEvent.click(screen.getByTestId('login-submit-button'))
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'Password1'))
  })

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce({ response: { data: { error: 'Invalid email or password' } } })
    renderLoginPage()
    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'WrongPass1' } })
    fireEvent.click(screen.getByTestId('login-submit-button'))
    await waitFor(() => expect(screen.getByTestId('login-error-message')).toHaveTextContent('Invalid email or password'))
  })
})
