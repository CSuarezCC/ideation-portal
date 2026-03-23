import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services/notificationService'

export function NotificationBell() {
  const [count, setCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetch = () => { notificationService.getUnreadCount().then(setCount).catch(() => {}) }
    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <button data-testid="notification-bell" onClick={() => navigate('/notifications')}
      className="text-indigo-100 hover:text-white p-1 rounded-full relative" aria-label="Notifications">
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {count > 0 && (
        <span data-testid="notification-badge" className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
