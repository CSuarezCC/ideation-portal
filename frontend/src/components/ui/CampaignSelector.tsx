import { useEffect, useState } from 'react'
import { campaignService, type Campaign } from '../../services/campaignService'

interface CampaignSelectorProps {
  selectedCampaignId: string
  onCampaignChange: (campaignId: string) => void
}

export function CampaignSelector({ selectedCampaignId, onCampaignChange }: CampaignSelectorProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    campaignService.list().then(all => {
      const sorted = all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setCampaigns(sorted)
      if (!selectedCampaignId && sorted.length > 0) {
        const defaultCampaign = sorted.find(c => c.status === 'EVALUATION' || c.status === 'CLOSED') ?? sorted[0]
        onCampaignChange(defaultCampaign.campaignId)
      }
    }).catch(() => {})
  }, [])

  return (
    <select data-testid="campaign-selector" value={selectedCampaignId}
      onChange={e => onCampaignChange(e.target.value)}
      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
      <option value="">Select campaign</option>
      {campaigns.map(c => (
        <option key={c.campaignId} value={c.campaignId}>{c.name} ({c.status})</option>
      ))}
    </select>
  )
}
