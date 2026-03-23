const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  EVALUATION: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-orange-100 text-orange-800',
  ANNOUNCED: 'bg-purple-100 text-purple-800',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span data-testid="status-badge" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}
