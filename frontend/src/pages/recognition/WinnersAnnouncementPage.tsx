import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { recognitionService, type WinnerRecord, type WinnerAnnouncement } from '../../services/recognitionService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

const BADGE_COLORS: Record<string, string> = {
  GOLD: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  SILVER: 'bg-gray-100 border-gray-400 text-gray-700',
  BRONZE: 'bg-orange-100 border-orange-400 text-orange-800',
}
const BADGE_EMOJI: Record<string, string> = { GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉' }

export function WinnersAnnouncementPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const [announcement, setAnnouncement] = useState<WinnerAnnouncement | null>(null)
  const [winners, setWinners] = useState<WinnerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!campaignId) return
    setLoading(true)
    Promise.all([
      recognitionService.getAnnouncement(campaignId).catch(() => null),
      recognitionService.getWinners(campaignId).catch(() => []),
    ]).then(([ann, win]) => {
      if (!ann) setError('No announcement found for this campaign.')
      else setAnnouncement(ann)
      setWinners(win)
    }).finally(() => setLoading(false))
  }, [campaignId])

  if (loading) return <LoadingSpinner fullPage />
  if (error) return <p className="text-gray-500 text-center mt-10">{error}</p>

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/leaderboard" className="text-indigo-600 text-sm hover:underline mb-4 inline-block">← Back to Leaderboard</Link>
      {announcement && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🏆 {announcement.campaignName}</h1>
          <p className="text-gray-600 mb-1">{announcement.message}</p>
          <p className="text-xs text-gray-400">Published {new Date(announcement.publishedAt!).toLocaleDateString()}</p>
        </div>
      )}
      <div className="space-y-4">
        {winners.sort((a, b) => a.rank - b.rank).map(w => (
          <div key={w.rank} className={`border-2 rounded-lg p-5 ${BADGE_COLORS[w.badgeType]}`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{BADGE_EMOJI[w.badgeType]}</span>
              <div>
                <h2 className="text-lg font-semibold">{w.ideaTitle}</h2>
                <p className="text-sm">by {w.submitterName} · Score: {w.compositeScore.toFixed(1)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
