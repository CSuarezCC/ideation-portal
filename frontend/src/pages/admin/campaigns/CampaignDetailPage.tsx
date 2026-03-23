import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { campaignService, type Campaign } from '../../../services/campaignService'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { DateRangeDisplay } from '../../../components/ui/DateRangeDisplay'
import { Button } from '../../../components/ui/Button'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'
import { userService } from '../../../services/userService'

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [panelMembers, setPanelMembers] = useState<any[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      campaignService.get(id),
      campaignService.getPanelMembers(id),
    ]).then(([c, members]) => {
      setCampaign(c)
      setPanelMembers(members)
      setSelectedIds(c.panelMemberIds)
      setLoading(false)
    })
  }, [id])

  const handleTransition = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const updated = await campaignService.transitionStatus(id)
      setCampaign(updated)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Transition failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm('Delete this campaign?')) return
    await campaignService.delete(id)
    navigate('/admin/campaigns')
  }

  const openPanelModal = async () => {
    const { users } = await userService.listUsers({ role: 'PANEL_MEMBER' })
    setAvailableUsers(users)
    setShowPanel(true)
  }

  const savePanelMembers = async () => {
    if (!id) return
    await campaignService.assignPanelMembers(id, selectedIds)
    const members = await campaignService.getPanelMembers(id)
    setPanelMembers(members)
    setCampaign(prev => prev ? { ...prev, panelMemberIds: selectedIds } : prev)
    setShowPanel(false)
  }

  const toggleUser = (userId: string) => {
    setSelectedIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId])
  }

  if (loading || !campaign) return <LoadingSpinner fullPage />

  const transitionLabel: Record<string, string> = { DRAFT: 'Activate Now', ACTIVE: 'Start Evaluation', EVALUATION: 'Close Campaign' }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <StatusBadge status={campaign.status} />
        </div>
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && (
            <>
              <Button data-testid="edit-campaign-button" variant="secondary" onClick={() => navigate(`/admin/campaigns/${id}/edit`)}>Edit</Button>
              <Button data-testid="delete-campaign-button" variant="danger" onClick={handleDelete}>Delete</Button>
            </>
          )}
          {transitionLabel[campaign.status] && (
            <Button data-testid="transition-campaign-button" onClick={handleTransition} loading={actionLoading}>{transitionLabel[campaign.status]}</Button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <p className="text-gray-700">{campaign.description}</p>
        <DateRangeDisplay label="Submissions" startDate={campaign.submissionStartDate} endDate={campaign.submissionEndDate} />
        <DateRangeDisplay label="Evaluation" startDate={campaign.evaluationStartDate} endDate={campaign.evaluationEndDate} />

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Panel Members ({panelMembers.length})</h2>
            <Button data-testid="manage-panel-button" variant="secondary" size="sm" onClick={openPanelModal}>Manage Panel</Button>
          </div>
          {panelMembers.length === 0 ? (
            <p className="text-gray-500 text-sm">No panel members assigned.</p>
          ) : (
            <ul className="space-y-1">
              {panelMembers.map((m: any) => (
                <li key={m.userId} className="text-sm text-gray-700">{m.name} ({m.email})</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" data-testid="panel-assignment-modal">
            <h3 className="text-lg font-semibold mb-4">Assign Panel Members</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableUsers.map((u: any) => (
                <label key={u.userId} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedIds.includes(u.userId)} onChange={() => toggleUser(u.userId)} />
                  <span className="text-sm">{u.name} ({u.email})</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button data-testid="save-panel-button" onClick={savePanelMembers}>Save</Button>
              <Button data-testid="cancel-panel-button" variant="secondary" onClick={() => setShowPanel(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
