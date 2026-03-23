const COLORS = {
  ADMIN: 'bg-purple-100 text-purple-800',
  PANEL_MEMBER: 'bg-blue-100 text-blue-800',
  EMPLOYEE: 'bg-green-100 text-green-800',
}

const LABELS = {
  ADMIN: 'Admin',
  PANEL_MEMBER: 'Panel Member',
  EMPLOYEE: 'Employee',
}

export function RoleBadge({ role }: { role: 'EMPLOYEE' | 'PANEL_MEMBER' | 'ADMIN' }) {
  return (
    <span
      data-testid="role-badge"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLORS[role]}`}
    >
      {LABELS[role]}
    </span>
  )
}
