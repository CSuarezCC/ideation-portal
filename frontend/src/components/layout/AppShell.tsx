import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { RoleBadge } from '../ui/RoleBadge'
import { NotificationBell } from '../ui/NotificationBell'

export function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <span className="text-white font-bold text-lg">Ideation Portal</span>
              <NavLink to="/leaderboard" className={navLinkClass}>Leaderboard</NavLink>
              <NavLink to="/ideas/submit" className={navLinkClass}>Submit Idea</NavLink>
              <NavLink to="/ideas/mine" className={navLinkClass}>My Ideas</NavLink>
              {(user?.role === 'PANEL_MEMBER' || user?.role === 'ADMIN') && (
                <>
                  <NavLink to="/evaluations" className={navLinkClass}>Evaluations</NavLink>
                  <NavLink to="/analytics" className={navLinkClass}>Analytics</NavLink>
                </>
              )}
              {user?.role === 'ADMIN' && (
                <>
                  <NavLink to="/admin/campaigns" className={navLinkClass}>Campaigns</NavLink>
                  <NavLink to="/admin/categories" className={navLinkClass}>Categories</NavLink>
                  <NavLink to="/admin/users" className={navLinkClass}>Users</NavLink>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                data-testid="user-menu-button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-indigo-100 hover:text-white"
              >
                <span className="text-sm">{user?.name}</span>
                {user && <RoleBadge role={user.role} />}
              </button>
              <button
                data-testid="logout-button"
                onClick={logout}
                className="text-indigo-100 hover:text-white text-sm px-2 py-1 rounded"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
