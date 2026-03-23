import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardService, type LeaderboardEntry } from '../../services/dashboardService'
import { recognitionService, type WinnerRecord } from '../../services/recognitionService'
import { campaignService } from '../../services/campaignService'
import { useAuth } from '../../context/AuthContext'
import { CampaignSelector } from '../../components/ui/CampaignSelector'
import { DimensionTabs } from '../../components/ui/DimensionTabs'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const BADGE_EMOJI: Record<string, string> = { GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉' }

export function LeaderboardPage() {
  const [campaignId, setCampaignId] = useState('')
  const [dimension, setDimension] = useState('composite')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [winners, setWinners] = useState<WinnerRecord[]>([])
  const [campaignStatus, setCampaignStatus] = useState('')
  const [announcing, setAnnouncing] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!campaignId) return
    setLoading(true)
    Promise.all([
      dashboardService.getLeaderboard(campaignId, dimension),
      recognitionService.getWinners(campaignId).catch(() => []),
      campaignService.get(campaignId).catch(() => null),
    ]).then(([leaderboard, win, camp]) => {
      setEntries(leaderboard)
      setWinners(win)
      setCampaignStatus(camp?.status ?? '')
    }).finally(() => setLoading(false))
  }, [campaignId, dimension])

  const handleSearch = () => {
    if (!campaignId || !searchQuery.trim()) return
    setLoading(true)
    dashboardService.search(campaignId, searchQuery.trim())
      .then(setEntries)
      .finally(() => setLoading(false))
  }

  const handleAnnounce = async () => {
    if (!campaignId) return
    setAnnouncing(true)
    try {
      await recognitionService.announce(campaignId)
      const [win, camp] = await Promise.all([
        recognitionService.getWinners(campaignId).catch(() => []),
        campaignService.get(campaignId).catch(() => null),
      ])
      setWinners(win)
      setCampaignStatus(camp?.status ?? '')
    } finally { setAnnouncing(false) }
  }

  const winnerMap = new Map(winners.map(w => [w.ideaId, w]))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <CampaignSelector selectedCampaignId={campaignId} onCampaignChange={setCampaignId} />
      </div>

      {/* Admin announce button */}
      {user?.role === 'ADMIN' && campaignStatus === 'CLOSED' && winners.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
          <span className="text-sm text-yellow-800">Winners have been determined. Ready to announce?</span>
          <button onClick={handleAnnounce} disabled={announcing}
            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50">
            {announcing ? 'Announcing...' : '🏆 Announce Winners'}
          </button>
        </div>
      )}

      {/* Winners section */}
      {winners.length > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">🏆 Winners</h2>
            <button onClick={() => navigate(`/recognition/${campaignId}`)}
              className="text-sm text-indigo-600 hover:underline">View full announcement →</button>
          </div>
          <div className="flex gap-4">
            {winners.sort((a, b) => a.rank - b.rank).map(w => (
              <div key={w.rank} className="flex-1 bg-white rounded-md p-3 border">
                <span className="text-xl">{BADGE_EMOJI[w.badgeType]}</span>
                <p className="text-sm font-medium truncate">{w.ideaTitle}</p>
                <p className="text-xs text-gray-500">{w.submitterName} · {w.compositeScore.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input data-testid="leaderboard-search-input" type="text" placeholder="Search ideas..."
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 max-w-xs" />
        <button data-testid="leaderboard-search-button" onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Search</button>
      </div>

      <DimensionTabs activeTab={dimension} onTabChange={setDimension} />

      {loading ? <LoadingSpinner fullPage /> : entries.length === 0 ? (
        <p className="text-gray-500">No ideas found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200" data-testid="leaderboard-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Idea</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Composite</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Feasibility</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impact</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Innovation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry, idx) => {
                const winner = winnerMap.get(entry.ideaId)
                return (
                  <tr key={entry.ideaId} data-testid={`leaderboard-row-${entry.ideaId}`}
                    className={`hover:bg-gray-50 cursor-pointer ${winner ? 'bg-yellow-50' : ''}`}
                    onClick={() => navigate(`/leaderboard/ideas/${entry.ideaId}`)}>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {winner ? BADGE_EMOJI[winner.badgeType] : idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{entry.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{entry.submitterName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">{entry.compositeScore?.toFixed(1) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">{entry.feasibilityAvg?.toFixed(1) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">{entry.impactAvg?.toFixed(1) ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-right">{entry.innovationAvg?.toFixed(1) ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
