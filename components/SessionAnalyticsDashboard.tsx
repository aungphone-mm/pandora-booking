'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { getSessionAnalytics } from '@/lib/tracking/sessionTracker'

type Session = {
  id: string
  user_id: string | null
  user_email: string | null
  user_name: string | null
  session_start: string
  session_end: string | null
  duration_seconds: number | null
  device_type: string
  browser_name: string
  browser_version: string
  os_name: string
  os_version: string
  device_model: string
  screen_resolution: string
  viewport_size: string
  timezone: string
  language: string
  page_url: string
  referrer: string
  landing_page: string
  is_mobile: boolean
  is_tablet: boolean
  is_desktop: boolean
  is_bot: boolean
  created_at: string
}

// Helper functions
const safeGetHostname = (url: string | null): string => {
  if (!url) return 'Direct'
  try {
    return new URL(url).hostname
  } catch {
    return url.substring(0, 30) + (url.length > 30 ? '...' : '')
  }
}

const safeGetPathname = (url: string | null): string => {
  if (!url) return '-'
  try {
    const pathname = new URL(url).pathname
    return pathname === '/' ? '🏠 Home' : pathname
  } catch {
    return url.substring(0, 30) + (url.length > 30 ? '...' : '')
  }
}

export default function SessionAnalyticsDashboard() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days' | 'all'>('7days')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [groupSessions, setGroupSessions] = useState(false)

  useEffect(() => {
    loadSessionData()
    setCurrentPage(1) // Reset to first page when timeframe changes
  }, [timeframe])

  // Group sessions by identical data
  const getGroupedSessions = () => {
    if (!groupSessions) return sessions

    const grouped = new Map<string, {
      session: Session
      count: number
      users: Set<string>
      latestDate: string
    }>()

    sessions.forEach(session => {
      // Create a key based on matching fields
      const key = `${session.device_type}|${session.device_model}|${session.browser_name}|${session.os_name}|${session.timezone}`

      if (grouped.has(key)) {
        const existing = grouped.get(key)!
        existing.count++
        if (session.user_name || session.user_email) {
          existing.users.add(session.user_name || session.user_email || 'Guest')
        }
        // Keep the latest date
        if (new Date(session.created_at) > new Date(existing.latestDate)) {
          existing.latestDate = session.created_at
        }
      } else {
        const users = new Set<string>()
        if (session.user_name || session.user_email) {
          users.add(session.user_name || session.user_email || 'Guest')
        }
        grouped.set(key, {
          session,
          count: 1,
          users,
          latestDate: session.created_at
        })
      }
    })

    // Convert back to array format
    return Array.from(grouped.values()).map(group => ({
      ...group.session,
      sessionCount: group.count,
      usersList: Array.from(group.users),
      created_at: group.latestDate
    }))
  }

  const displaySessions = getGroupedSessions()

  const getTimeframeDate = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (timeframe) {
      case 'today':
        return { startDate: today.toISOString(), endDate: new Date().toISOString() }
      case '7days':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)
        return { startDate: sevenDaysAgo.toISOString(), endDate: new Date().toISOString() }
      case '30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 30)
        return { startDate: thirtyDaysAgo.toISOString(), endDate: new Date().toISOString() }
      default:
        return { startDate: '2020-01-01', endDate: new Date().toISOString() }
    }
  }

  const loadSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      const dates = getTimeframeDate()
      const analyticsData = await getSessionAnalytics(dates)

      if (analyticsData) {
        setAnalytics(analyticsData)
        setSessions(analyticsData.sessions)
      }
    } catch (err: any) {
      console.error('Error loading session data:', err)
      setError(err.message || 'Failed to load session data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-12 text-center border border-slate-100">
        <div className="inline-block w-12 h-12 border-4 border-slate-100 border-t-pink-500 rounded-full animate-spin mb-5"></div>
        <h2 className="text-2xl font-bold mb-2 text-slate-800">Loading Session Analytics</h2>
        <p className="text-slate-500 text-base">Please wait while we fetch your data...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 rounded-[20px] shadow-[0_15px_35px_rgba(102,126,234,0.3)] p-8 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-4xl font-extrabold m-0 mb-2 drop-shadow-sm">📊 Session Analytics</h2>
            <p className="text-lg m-0 opacity-90">Track user devices, browsers, and visit patterns</p>
          </div>
          <button
            onClick={loadSessionData}
            className="bg-gradient-to-br from-pink-500 to-pink-700 text-white px-6 py-4 rounded-xl border-none cursor-pointer font-semibold text-base shadow-[0_6px_20px_rgba(236,72,153,0.3)] hover:-translate-y-px hover:shadow-[0_8px_25px_rgba(236,72,153,0.4)] active:translate-y-0 transition-all duration-200"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-300 rounded-2xl p-6 shadow-[0_8px_25px_rgba(248,113,113,0.2)]">
          <p className="text-red-600 font-semibold m-0">⚠️ {error}</p>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="bg-white rounded-[20px] shadow-[0_8px_25px_rgba(0,0,0,0.06)] p-6 border border-slate-100">
        <h3 className="text-xl font-bold m-0 mb-4 text-slate-800">📅 Timeframe</h3>
        <div className="flex gap-3 flex-wrap">
          {(['today', '7days', '30days', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-6 py-3 rounded-xl border-2 cursor-pointer font-semibold text-sm transition-all duration-200 ${
                timeframe === period
                  ? 'border-pink-500 bg-pink-50 text-pink-500'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-pink-300'
              }`}
            >
              {period === 'today' && 'Today'}
              {period === '7days' && 'Last 7 Days'}
              {period === '30days' && 'Last 30 Days'}
              {period === 'all' && 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Sessions */}
            <div className="bg-gradient-to-br from-blue-100 to-blue-300 p-7 rounded-2xl border border-blue-400 shadow-[0_6px_20px_rgba(59,130,246,0.15)]">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="text-sm font-semibold text-blue-900 uppercase m-0 mb-2">Total Sessions</h3>
              <p className="text-5xl font-extrabold text-blue-900 m-0">{analytics.totalSessions}</p>
            </div>

            {/* Mobile Sessions */}
            <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-7 rounded-2xl border border-amber-400 shadow-[0_6px_20px_rgba(251,191,36,0.15)]">
              <div className="text-3xl mb-2">📱</div>
              <h3 className="text-sm font-semibold text-amber-900 uppercase m-0 mb-2">Mobile Sessions</h3>
              <p className="text-5xl font-extrabold text-amber-900 m-0">{analytics.mobileSessions}</p>
              <p className="text-sm text-amber-900 mt-2 mb-0">{analytics.mobilePercentage}% of total</p>
            </div>

            {/* Desktop Sessions */}
            <div className="bg-gradient-to-br from-green-100 to-green-200 p-7 rounded-2xl border border-green-400 shadow-[0_6px_20px_rgba(74,222,128,0.15)]">
              <div className="text-3xl mb-2">💻</div>
              <h3 className="text-sm font-semibold text-green-800 uppercase m-0 mb-2">Desktop Sessions</h3>
              <p className="text-5xl font-extrabold text-green-800 m-0">{analytics.desktopSessions}</p>
            </div>

            {/* Registered Users */}
            <div className="bg-gradient-to-br from-violet-100 to-violet-200 p-7 rounded-2xl border border-violet-300 shadow-[0_6px_20px_rgba(167,139,250,0.15)]">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="text-sm font-semibold text-violet-800 uppercase m-0 mb-2">Registered Users</h3>
              <p className="text-5xl font-extrabold text-violet-800 m-0">{analytics.registeredUsers}</p>
            </div>
          </div>

          {/* Browser & OS Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Browser Stats */}
            <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-8 border border-slate-100">
              <h3 className="text-2xl font-bold m-0 mb-5 text-slate-800">🌐 Browser Usage</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(analytics.browserCount).map(([browser, count]) => (
                  <div key={browser} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-600">{browser}</span>
                    <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* OS Stats */}
            <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-8 border border-slate-100">
              <h3 className="text-2xl font-bold m-0 mb-5 text-slate-800">💿 Operating Systems</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(analytics.osCount).map(([os, count]) => (
                  <div key={os} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-600">{os}</span>
                    <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-sm font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div className="bg-white rounded-[20px] shadow-[0_15px_35px_rgba(0,0,0,0.08)] p-8 border border-slate-100">
            <div className="flex justify-between items-center mb-5 flex-wrap gap-4">
              <h3 className="text-2xl font-bold m-0 text-slate-800">📋 Recent Sessions</h3>

              <button
                onClick={() => {
                  setGroupSessions(!groupSessions)
                  setCurrentPage(1)
                }}
                className={`px-5 py-3 rounded-xl border-2 cursor-pointer font-semibold text-sm transition-all duration-200 ${
                  groupSessions
                    ? 'border-pink-500 bg-pink-50 text-pink-500'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {groupSessions ? '✓ Grouped View' : '○ Group Similar Sessions'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    {groupSessions && (
                      <th className="p-3 text-left font-bold text-gray-700 text-sm">Count</th>
                    )}
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">User</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Device Type</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Phone/Device</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Browser</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">OS</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Screen</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Language</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Duration</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Referrer</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Landing Page</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Bot</th>
                    <th className="p-3 text-left font-bold text-gray-700 text-sm">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {displaySessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((session, idx) => (
                    <tr key={session.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      {groupSessions && (
                        <td className="p-4">
                          <div className="inline-block bg-pink-500 text-white px-3 py-1.5 rounded-full font-bold text-base">
                            {(session as any).sessionCount}×
                          </div>
                        </td>
                      )}
                      <td className="p-4">
                        <div>
                          {groupSessions && (session as any).usersList?.length > 0 ? (
                            <>
                              <p className="m-0 font-semibold text-slate-800">
                                {(session as any).usersList.length} user{(session as any).usersList.length > 1 ? 's' : ''}
                              </p>
                              <p className="mt-1 mb-0 text-xs text-slate-500">
                                {(session as any).usersList.slice(0, 2).join(', ')}
                                {(session as any).usersList.length > 2 && ` +${(session as any).usersList.length - 2} more`}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="m-0 font-semibold text-slate-800">
                                {session.user_name || session.user_email || 'Guest'}
                              </p>
                              {session.user_id && (
                                <p className="mt-1 mb-0 text-sm text-slate-500">
                                  🔐 Registered
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          session.is_mobile ? 'bg-yellow-100 text-amber-900' :
                          session.is_tablet ? 'bg-blue-100 text-blue-900' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {session.device_type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-semibold text-sm">
                        {session.device_model || '-'}
                      </td>

                      {/* Browser with version */}
                      <td className="p-4 text-slate-600 text-sm">
                        <div>
                          <p className="m-0 font-semibold">{session.browser_name || 'Unknown'}</p>
                          {session.browser_version && (
                            <p className="mt-0.5 mb-0 text-xs text-slate-400">
                              v{session.browser_version}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* OS with version */}
                      <td className="p-4 text-slate-600 text-sm">
                        <div>
                          <p className="m-0 font-semibold">{session.os_name || 'Unknown'}</p>
                          {session.os_version && (
                            <p className="mt-0.5 mb-0 text-xs text-slate-400">
                              v{session.os_version}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Screen Resolution */}
                      <td className="p-4 text-sm text-slate-500">
                        <div>
                          <p className="m-0 font-semibold">{session.screen_resolution || '-'}</p>
                          {session.viewport_size && session.viewport_size !== session.screen_resolution && (
                            <p className="mt-0.5 mb-0 text-xs text-slate-400">
                              View: {session.viewport_size}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Language */}
                      <td className="p-4 text-sm text-slate-500 font-semibold">
                        {session.language ? session.language.split('-')[0].toUpperCase() : '-'}
                      </td>

                      {/* Duration */}
                      <td className="p-4 text-sm">
                        {(() => {
                          let durationSeconds = session.duration_seconds

                          // If no duration but has session_start, calculate duration
                          if (!durationSeconds && session.session_start) {
                            const startTime = new Date(session.session_start).getTime()
                            const endTime = session.session_end ? new Date(session.session_end).getTime() : Date.now()
                            durationSeconds = Math.floor((endTime - startTime) / 1000)
                          }

                          if (durationSeconds && durationSeconds > 0) {
                            const minutes = Math.floor(durationSeconds / 60)
                            const seconds = durationSeconds % 60
                            const isActive = !session.session_end

                            return (
                              <span className={`px-2 py-1 rounded-md font-semibold text-xs inline-flex items-center gap-1 ${
                                durationSeconds > 300 ? 'bg-green-100 text-green-800' :
                                durationSeconds > 60 ? 'bg-yellow-100 text-amber-900' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {minutes}m {seconds}s
                                {isActive && <span className="text-[0.6rem] opacity-70">●</span>}
                              </span>
                            )
                          }

                          return (
                            <span className="text-slate-400 text-xs">-</span>
                          )
                        })()}
                      </td>

                      {/* Referrer */}
                      <td className="p-4 text-sm text-slate-500 max-w-[200px]">
                        {session.referrer ? (
                          <div className="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                            {session.referrer.includes('google') ? '🔍 Google' :
                             session.referrer.includes('facebook') ? '👥 Facebook' :
                             session.referrer.includes('instagram') ? '📸 Instagram' :
                             session.referrer.includes('twitter') ? '🐦 Twitter' :
                             safeGetHostname(session.referrer)}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Direct</span>
                        )}
                      </td>

                      {/* Landing Page */}
                      <td className="p-4 text-sm text-slate-500 max-w-[150px]">
                        <div className="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                          {safeGetPathname(session.landing_page)}
                        </div>
                      </td>

                      {/* Bot Flag */}
                      <td className="p-4 text-center">
                        {session.is_bot ? (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md font-bold text-[0.7rem]">
                            🤖 BOT
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Time */}
                      <td className="p-4 text-sm text-slate-500 whitespace-nowrap">
                        {format(new Date(session.created_at), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <label className="text-slate-500 font-semibold">Rows per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="px-3 py-2 rounded-lg border-2 border-slate-200 bg-white text-slate-800 font-semibold cursor-pointer hover:border-pink-300 transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-slate-500 font-semibold">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, displaySessions.length)} of {displaySessions.length}
                  {groupSessions && ` (${sessions.length} total sessions)`}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg border-2 border-slate-200 font-semibold transition-all ${
                      currentPage === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-800 cursor-pointer hover:border-pink-300'
                    }`}
                  >
                    ⏮️ First
                  </button>

                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg border-2 border-slate-200 font-semibold transition-all ${
                      currentPage === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-800 cursor-pointer hover:border-pink-300'
                    }`}
                  >
                    ◀️ Previous
                  </button>

                  <span className="px-4 py-2 rounded-lg border-2 border-pink-500 bg-pink-50 text-pink-500 font-bold">
                    Page {currentPage} of {Math.ceil(displaySessions.length / itemsPerPage)}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(displaySessions.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(displaySessions.length / itemsPerPage)}
                    className={`px-3 py-2 rounded-lg border-2 border-slate-200 font-semibold transition-all ${
                      currentPage >= Math.ceil(displaySessions.length / itemsPerPage)
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-800 cursor-pointer hover:border-pink-300'
                    }`}
                  >
                    Next ▶️
                  </button>

                  <button
                    onClick={() => setCurrentPage(Math.ceil(displaySessions.length / itemsPerPage))}
                    disabled={currentPage >= Math.ceil(displaySessions.length / itemsPerPage)}
                    className={`px-3 py-2 rounded-lg border-2 border-slate-200 font-semibold transition-all ${
                      currentPage >= Math.ceil(displaySessions.length / itemsPerPage)
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-800 cursor-pointer hover:border-pink-300'
                    }`}
                  >
                    Last ⏭️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
