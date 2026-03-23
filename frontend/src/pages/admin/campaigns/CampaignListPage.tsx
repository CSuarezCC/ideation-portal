import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { campaignService, type Campaign } from '../../../services/campaignService'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

const STATUSES = ['ALL', 'DRAFT', 'ACTIVE', 'EVALUATION', 'CLOSED', 'ANNOUNCED'] as const

export function CampaignListPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    campaignService.list(statusFilter === 'ALL' ? undefined : statusFilter)
      .then(setCampaigns)
      .finally(() => setLoading(false))
  }, [statusFilter])

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <Button data-testid="create-campaign-button" onClick={() => navigate('/admin/campaigns/new')}>Create Campaign</Button>
      </div>

      <div className="mb-4 flex gap-2">
        {STATUSES.map(s => (
          <button
            key={s}
            data-testid={`filter-${s.toLowerCase()}`}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <p className="text-gray-500">No campaigns found.</p>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(c => (
            <div
              key={c.campaignId}
              data-testid={`campaign-card-${c.campaignId}`}
              onClick={() => navigate(`/admin/campaigns/${c.campaignId}`)}
              className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{c.name}</h2>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description}</p>
              <div className="text-xs text-gray-400 mt-2">{c.panelMemberIds.length} panel members</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
