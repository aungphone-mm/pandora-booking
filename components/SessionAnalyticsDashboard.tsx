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
  os_name: string
  device_model: string
  screen_resolution: string
  timezone: string
  language: string
  page_url: string
  is_mobile: boolean
  is_tablet: boolean
  is_desktop: boolean
  created_at: string
}

export default function SessionAnalyticsDashboard() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<Session[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days' | 'all'>('7days')

  useEffect(() => {
    loadSessionData()
  }, [timeframe])

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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
        padding: '48px',
        textAlign: 'center',
        border: '1px solid #f1f5f9'
      }}>
        <div style={{
          display: 'inline-block',
          width: '48px',
          height: '48px',
          border: '4px solid #f1f5f9',
          borderTop: '4px solid #ec4899',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }}></div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '8px',
          color: '#1e293b'
        }}>Loading Session Analytics</h2>
        <p style={{
          color: '#64748b',
          fontSize: '1rem'
        }}>Please wait while we fetch your data...</p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        boxShadow: '0 15px 35px rgba(102, 126, 234, 0.3)',
        padding: '32px',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div>
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: '800',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>📊 Session Analytics</h2>
            <p style={{
              fontSize: '1.1rem',
              margin: '0',
              opacity: '0.9'
            }}>Track user devices, browsers, and visit patterns</p>
          </div>
          <button
            onClick={loadSessionData}
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              boxShadow: '0 6px 20px rgba(236, 72, 153, 0.3)'
            }}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
          border: '1px solid #f87171',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 8px 25px rgba(248, 113, 113, 0.2)'
        }}>
          <p style={{ color: '#dc2626', fontWeight: '600', margin: '0' }}>⚠️ {error}</p>
        </div>
      )}

      {/* Timeframe Selector */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.06)',
        padding: '24px',
        border: '1px solid #f1f5f9'
      }}>
        <h3 style={{
          fontSize: '1.2rem',
          fontWeight: '700',
          margin: '0 0 16px 0',
          color: '#1e293b'
        }}>📅 Timeframe</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {(['today', '7days', '30days', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: timeframe === period ? '#ec4899' : '#e2e8f0',
                backgroundColor: timeframe === period ? '#fdf2f8' : 'white',
                color: timeframe === period ? '#ec4899' : '#64748b',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {/* Total Sessions */}
            <div style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid #60a5fa',
              boxShadow: '0 6px 20px rgba(59, 130, 246, 0.15)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#1e40af',
                textTransform: 'uppercase',
                margin: '0 0 8px 0'
              }}>Total Sessions</h3>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#1e40af',
                margin: '0'
              }}>{analytics.totalSessions}</p>
            </div>

            {/* Mobile Sessions */}
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid #fbbf24',
              boxShadow: '0 6px 20px rgba(251, 191, 36, 0.15)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📱</div>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#92400e',
                textTransform: 'uppercase',
                margin: '0 0 8px 0'
              }}>Mobile Sessions</h3>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#92400e',
                margin: '0'
              }}>{analytics.mobileSessions}</p>
              <p style={{
                fontSize: '0.9rem',
                color: '#92400e',
                margin: '8px 0 0 0'
              }}>{analytics.mobilePercentage}% of total</p>
            </div>

            {/* Desktop Sessions */}
            <div style={{
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid #4ade80',
              boxShadow: '0 6px 20px rgba(74, 222, 128, 0.15)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💻</div>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#166534',
                textTransform: 'uppercase',
                margin: '0 0 8px 0'
              }}>Desktop Sessions</h3>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#166534',
                margin: '0'
              }}>{analytics.desktopSessions}</p>
            </div>

            {/* Registered Users */}
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid #a78bfa',
              boxShadow: '0 6px 20px rgba(167, 139, 250, 0.15)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔐</div>
              <h3 style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#6d28d9',
                textTransform: 'uppercase',
                margin: '0 0 8px 0'
              }}>Registered Users</h3>
              <p style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                color: '#6d28d9',
                margin: '0'
              }}>{analytics.registeredUsers}</p>
            </div>
          </div>

          {/* Browser & OS Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px'
          }}>
            {/* Browser Stats */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
              padding: '32px',
              border: '1px solid #f1f5f9'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 0 20px 0',
                color: '#1e293b'
              }}>🌐 Browser Usage</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(analytics.browserCount).map(([browser, count]) => (
                  <div key={browser} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>{browser}</span>
                    <span style={{
                      backgroundColor: '#ec4899',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* OS Stats */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
              padding: '32px',
              border: '1px solid #f1f5f9'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                margin: '0 0 20px 0',
                color: '#1e293b'
              }}>💿 Operating Systems</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(analytics.osCount).map(([os, count]) => (
                  <div key={os} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#475569' }}>{os}</span>
                    <span style={{
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Sessions Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.08)',
            padding: '32px',
            border: '1px solid #f1f5f9'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              margin: '0 0 20px 0',
              color: '#1e293b'
            }}>📋 Recent Sessions</h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Device</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Browser</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>OS</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Location</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 20).map((session, idx) => (
                    <tr key={session.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? 'white' : '#fafbfc'
                    }}>
                      <td style={{ padding: '16px' }}>
                        <div>
                          <p style={{ margin: '0', fontWeight: '600', color: '#1e293b' }}>
                            {session.user_name || session.user_email || 'Guest'}
                          </p>
                          {session.user_id && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                              🔐 Registered
                            </p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          backgroundColor: session.is_mobile ? '#fef3c7' : session.is_tablet ? '#dbeafe' : '#dcfce7',
                          color: session.is_mobile ? '#92400e' : session.is_tablet ? '#1e40af' : '#166534'
                        }}>
                          {session.device_type}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#475569' }}>{session.browser_name || 'Unknown'}</td>
                      <td style={{ padding: '16px', color: '#475569' }}>{session.os_name || 'Unknown'}</td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                        {session.timezone || 'Unknown'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                        {format(new Date(session.created_at), 'MMM d, h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
