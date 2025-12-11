/**
 * Session management - create, update, and end sessions
 */

import { createClient } from '@/lib/supabase/client'
import { getDeviceInfo } from './deviceDetection'

/**
 * Creates a new session record in the database
 */
export async function trackSession(userData?: {
  userId?: string
  userEmail?: string
  userName?: string
}): Promise<string | null> {
  try {
    const supabase = createClient()
    const deviceInfo = getDeviceInfo()

    const sessionData = {
      user_id: userData?.userId || null,
      user_email: userData?.userEmail || null,
      user_name: userData?.userName || null,

      // Device information
      device_info: deviceInfo,
      user_agent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      browser_name: deviceInfo.browserName,
      browser_version: deviceInfo.browserVersion,
      os_name: deviceInfo.osName,
      os_version: deviceInfo.osVersion,
      device_type: deviceInfo.deviceType,
      device_model: deviceInfo.deviceModel,

      // Screen information
      screen_resolution: deviceInfo.screenResolution,
      viewport_size: deviceInfo.viewportSize,

      // Location and language
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,

      // Page information
      page_url: window.location.href,
      referrer: document.referrer || null,
      landing_page: window.location.href,

      // Device flags
      is_mobile: deviceInfo.isMobile,
      is_tablet: deviceInfo.isTablet,
      is_desktop: deviceInfo.isDesktop,
      is_bot: deviceInfo.isBot,

      session_start: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .insert(sessionData)
      .select('id')
      .single()

    if (error) {
      console.error('Error tracking session:', error)
      return null
    }

    // Store session ID in sessionStorage for later updates
    if (data?.id) {
      sessionStorage.setItem('current_session_id', data.id)
    }

    return data?.id || null
  } catch (error) {
    console.error('Error in trackSession:', error)
    return null
  }
}

/**
 * Updates the session end time when user leaves
 */
export async function endSession(sessionId?: string): Promise<void> {
  try {
    const supabase = createClient()
    const id = sessionId || sessionStorage.getItem('current_session_id')

    if (!id) return

    const sessionStart = sessionStorage.getItem('session_start_time')
    const startTime = sessionStart ? new Date(sessionStart) : new Date()
    const endTime = new Date()
    const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    await supabase
      .from('user_sessions')
      .update({
        session_end: endTime.toISOString(),
        duration_seconds: durationSeconds
      })
      .eq('id', id)

    sessionStorage.removeItem('current_session_id')
    sessionStorage.removeItem('session_start_time')
  } catch (error) {
    console.error('Error ending session:', error)
  }
}

/**
 * Track page view within current session
 */
export async function trackPageView(pageName: string): Promise<void> {
  try {
    const sessionId = sessionStorage.getItem('current_session_id')
    if (!sessionId) return

    const supabase = createClient()

    await supabase
      .from('user_sessions')
      .update({
        page_url: window.location.href,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
  } catch (error) {
    console.error('Error tracking page view:', error)
  }
}
