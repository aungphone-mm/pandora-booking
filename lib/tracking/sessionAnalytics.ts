/**
 * Session analytics and reporting
 */

import { createClient } from '@/lib/supabase/client'
import type { SessionAnalytics } from './types'

/**
 * Get session analytics summary for a given timeframe
 */
export async function getSessionAnalytics(timeframe: {
  startDate: string
  endDate: string
}): Promise<SessionAnalytics | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .gte('created_at', timeframe.startDate)
      .lte('created_at', timeframe.endDate)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate analytics
    const totalSessions = data?.length || 0
    const mobileSessions = data?.filter(s => s.is_mobile).length || 0
    const tabletSessions = data?.filter(s => s.is_tablet).length || 0
    const desktopSessions = data?.filter(s => s.is_desktop).length || 0
    const registeredUsers = data?.filter(s => s.user_id !== null).length || 0
    const guestSessions = totalSessions - registeredUsers

    // Browser breakdown
    const browserCount: Record<string, number> = {}
    const osCount: Record<string, number> = {}
    const deviceModelCount: Record<string, number> = {}

    data?.forEach(session => {
      const browser = session.browser_name || 'Unknown'
      const os = session.os_name || 'Unknown'
      const device = session.device_model || 'Unknown'

      browserCount[browser] = (browserCount[browser] || 0) + 1
      osCount[os] = (osCount[os] || 0) + 1
      deviceModelCount[device] = (deviceModelCount[device] || 0) + 1
    })

    return {
      totalSessions,
      mobileSessions,
      tabletSessions,
      desktopSessions,
      registeredUsers,
      guestSessions,
      mobilePercentage: totalSessions > 0 ? (mobileSessions / totalSessions * 100).toFixed(1) : '0',
      browserCount,
      osCount,
      deviceModelCount,
      sessions: data || []
    }
  } catch (error) {
    console.error('Error getting session analytics:', error)
    return null
  }
}
