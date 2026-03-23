import { useEffect, useState } from 'react'
import { userService, type UserProfile } from '../../../services/userService'
import { Button } from '../../../components/ui/Button'
import { RoleBadge } from '../../../components/ui/RoleBadge'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadUsers = async () => {
    try {
      const result = await userService.listUsers()
      setUsers(result.users)
    } catch {
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void loadUsers() }, [])

  const handleRoleChange = async (userId: string, role: UserProfile['role']) => {
    setActionLoading(userId)
    try {
      await userService.assignRole(userId, role)
      setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, role } : u))
    } catch {
      setError('Failed to update role')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return
    setActionLoading(userId)
    try {
      await userService.deactivateUser(userId)
      setUsers((prev) => prev.map((u) => u.userId === userId ? { ...u, status: 'INACTIVE' } : u))
    } catch {
      setError('Failed to deactivate user')
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Management</h1>
      {error && <p className="mb-4 text-sm text-red-600" role="alert">{error}</p>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200" data-testid="users-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.userId} data-testid={`user-row-${user.userId}`}>
                <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4"><RoleBadge role={user.role} /></td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <select
                    data-testid={`role-select-${user.userId}`}
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.userId, e.target.value as UserProfile['role'])}
                    disabled={actionLoading === user.userId || user.status === 'INACTIVE'}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="PANEL_MEMBER">Panel Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {user.status === 'ACTIVE' && (
                    <Button
                      variant="danger"
                      data-testid={`deactivate-button-${user.userId}`}
                      isLoading={actionLoading === user.userId}
                      onClick={() => handleDeactivate(user.userId)}
                    >
                      Deactivate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
