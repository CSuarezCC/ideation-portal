import { useEffect, useState } from 'react'
import { notificationService, type Notification } from '../../services/notificationService'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function NotificationCenterPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadNotifications = (token?: string) => {
    const setLoad = token ? setLoadingMore : setLoading
    setLoad(true)
    notificationService.getNotifications(token)
      .then(result => {
        setNotifications(prev => token ? [...prev, ...result.notifications] : result.notifications)
        setNextPageToken(result.nextPageToken)
      })
      .finally(() => setLoad(false))
  }

  useEffect(() => { loadNotifications() }, [])

  const handleMarkAsRead = async (notificationId: string) => {
    await notificationService.markAsRead(notificationId)
    setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n))
  }

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  if (loading) return <LoadingSpinner fullPage />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button data-testid="mark-all-read-button" onClick={handleMarkAllAsRead}
          className="text-sm text-indigo-600 hover:text-indigo-800">Mark all as read</button>
      </div>

      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.notificationId} data-testid={`notification-${n.notificationId}`}
              className={`p-4 rounded-lg shadow cursor-pointer ${n.isRead ? 'bg-white' : 'bg-indigo-50 border-l-4 border-indigo-500'}`}
              onClick={() => !n.isRead && handleMarkAsRead(n.notificationId)}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1">{n.message}</p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {nextPageToken && (
            <button data-testid="load-more-button" onClick={() => loadNotifications(nextPageToken)}
              disabled={loadingMore}
              className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:text-gray-400">
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
