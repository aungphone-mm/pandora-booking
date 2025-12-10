import { createClient } from '@/lib/supabase/client'

export interface DeviceInfo {
  userAgent: string
  platform: string
  browserName: string
  browserVersion: string
  osName: string
  osVersion: string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown'
  deviceModel: string
  screenResolution: string
  viewportSize: string
  timezone: string
  language: string
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isBot: boolean
}

export interface SessionData {
  userId?: string | null
  userEmail?: string | null
  userName?: string | null
  deviceInfo: DeviceInfo
  pageUrl: string
  referrer: string
  landingPage: string
  ipAddress?: string
}

/**
 * Parse browser information from user agent
 */
function parseBrowser(ua: string): { name: string; version: string } {
  let browserName = 'Unknown'
  let browserVersion = ''

  if (ua.includes('Firefox/')) {
    browserName = 'Firefox'
    browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Chrome/') && !ua.includes('Edg')) {
    browserName = 'Chrome'
    browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browserName = 'Safari'
    browserVersion = ua.split('Version/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Edg/')) {
    browserName = 'Edge'
    browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || ''
  } else if (ua.includes('Opera/') || ua.includes('OPR/')) {
    browserName = 'Opera'
    browserVersion = ua.split('OPR/')[1]?.split(' ')[0] || ''
  }

  return { name: browserName, version: browserVersion }
}

/**
 * Parse OS information from user agent
 */
function parseOS(ua: string): { name: string; version: string } {
  let osName = 'Unknown'
  let osVersion = ''

  if (ua.includes('Windows NT')) {
    osName = 'Windows'
    const match = ua.match(/Windows NT ([\d.]+)/)
    osVersion = match ? match[1] : ''
  } else if (ua.includes('Mac OS X')) {
    osName = 'macOS'
    const match = ua.match(/Mac OS X ([\d_]+)/)
    osVersion = match ? match[1].replace(/_/g, '.') : ''
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    osName = ua.includes('iPhone') ? 'iOS' : 'iPadOS'
    const match = ua.match(/OS ([\d_]+)/)
    osVersion = match ? match[1].replace(/_/g, '.') : ''
  } else if (ua.includes('Android')) {
    osName = 'Android'
    const match = ua.match(/Android ([\d.]+)/)
    osVersion = match ? match[1] : ''
  } else if (ua.includes('Linux')) {
    osName = 'Linux'
  }

  return { name: osName, version: osVersion }
}

/**
 * Detect specific iPhone model based on screen resolution and pixel ratio
 */
function detectiPhoneModel(screenWidth: number, screenHeight: number, pixelRatio: number): string {
  const width = Math.min(screenWidth, screenHeight)
  const height = Math.max(screenWidth, screenHeight)

  // iPhone models by screen specs (physical pixels)
  const physicalWidth = width * pixelRatio
  const physicalHeight = height * pixelRatio

  // iPhone 15 Pro Max / 14 Pro Max / 13 Pro Max / 12 Pro Max
  if (physicalWidth === 1290 && physicalHeight === 2796) return 'iPhone 15 Pro Max'
  if (physicalWidth === 1284 && physicalHeight === 2778) return 'iPhone 14 Pro Max'

  // iPhone 15 Pro / 15 / 14 Pro / 13 Pro / 12 Pro
  if (physicalWidth === 1179 && physicalHeight === 2556) return 'iPhone 15 Pro'
  if (physicalWidth === 1170 && physicalHeight === 2532) {
    return 'iPhone 14 Pro/13 Pro/12 Pro'
  }

  // iPhone 15 Plus / 14 Plus
  if (physicalWidth === 1284 && physicalHeight === 2778) return 'iPhone 15 Plus'

  // iPhone 14 / 13 / 12 / 11
  if (physicalWidth === 828 && physicalHeight === 1792) return 'iPhone 14/13/12/11'

  // iPhone SE (3rd gen) / SE (2nd gen) / 8 / 7 / 6s
  if (physicalWidth === 750 && physicalHeight === 1334) return 'iPhone SE/8/7/6s'

  // iPhone 13 mini / 12 mini
  if (physicalWidth === 1080 && physicalHeight === 2340) return 'iPhone 13/12 mini'

  // iPhone 11 Pro Max / XS Max
  if (physicalWidth === 1242 && physicalHeight === 2688) return 'iPhone 11 Pro Max/XS Max'

  // iPhone X / XS / 11 Pro
  if (physicalWidth === 1125 && physicalHeight === 2436) return 'iPhone X/XS/11 Pro'

  // iPhone XR
  if (physicalWidth === 828 && physicalHeight === 1792) return 'iPhone XR'

  // iPhone Plus models (6+, 7+, 8+)
  if (physicalWidth === 1080 && physicalHeight === 1920 ||
      physicalWidth === 1242 && physicalHeight === 2208) return 'iPhone Plus (6/7/8)'

  return 'iPhone (Unknown Model)'
}

/**
 * Detect specific iPad model based on screen resolution
 */
function detectiPadModel(screenWidth: number, screenHeight: number, pixelRatio: number): string {
  const width = Math.min(screenWidth, screenHeight)
  const height = Math.max(screenWidth, screenHeight)

  const physicalWidth = width * pixelRatio
  const physicalHeight = height * pixelRatio

  // iPad Pro 12.9" (all generations)
  if (physicalWidth === 2048 && physicalHeight === 2732) return 'iPad Pro 12.9"'

  // iPad Pro 11" / iPad Air (4th/5th gen)
  if (physicalWidth === 1668 && physicalHeight === 2388) return 'iPad Pro 11"/Air'

  // iPad Pro 10.5" / iPad Air (3rd gen)
  if (physicalWidth === 1668 && physicalHeight === 2224) return 'iPad Pro 10.5"/Air'

  // iPad (10th gen)
  if (physicalWidth === 1640 && physicalHeight === 2360) return 'iPad (10th gen)'

  // iPad (9th gen and earlier) / iPad mini
  if (physicalWidth === 1536 && physicalHeight === 2048) return 'iPad/iPad mini'

  return 'iPad (Unknown Model)'
}

/**
 * Parse device model from user agent and screen specs
 */
function parseDevice(ua: string, screenWidth?: number, screenHeight?: number, pixelRatio?: number): string {
  if (ua.includes('iPhone') && screenWidth && screenHeight && pixelRatio) {
    return detectiPhoneModel(screenWidth, screenHeight, pixelRatio)
  }

  if (ua.includes('iPad') && screenWidth && screenHeight && pixelRatio) {
    return detectiPadModel(screenWidth, screenHeight, pixelRatio)
  }

  if (ua.includes('iPhone')) return 'iPhone'
  if (ua.includes('iPad')) return 'iPad'

  if (ua.includes('Android')) {
    // Try multiple patterns to extract device name
    let deviceName = ''

    // Samsung-specific detection (highest priority)
    if (ua.includes('Samsung') || ua.includes('SM-')) {
      // Try to find Samsung model number (SM-XXXX format)
      const samsungMatch = ua.match(/SM-[A-Z0-9]+/i)
      if (samsungMatch) {
        deviceName = samsungMatch[0]
      } else {
        // Try alternative Samsung format
        const samsungAlt = ua.match(/SAMSUNG[\s-]?([A-Z0-9-]+)/i)
        if (samsungAlt) {
          deviceName = `Samsung ${samsungAlt[1]}`
        }
      }
    }

    // Google Pixel detection
    if (!deviceName && ua.includes('Pixel')) {
      const pixelMatch = ua.match(/Pixel[\s]?([0-9]+[a-zA-Z]*)/i)
      deviceName = pixelMatch ? `Pixel ${pixelMatch[1]}` : 'Google Pixel'
    }

    // OnePlus detection
    if (!deviceName && ua.includes('OnePlus')) {
      const onePlusMatch = ua.match(/OnePlus[\s]?([A-Z0-9]+)/i)
      deviceName = onePlusMatch ? onePlusMatch[0] : 'OnePlus'
    }

    // Xiaomi/Redmi detection
    if (!deviceName && (ua.includes('Xiaomi') || ua.includes('Redmi') || ua.includes('POCO'))) {
      const xiaomiMatch = ua.match(/(Redmi|POCO|Mi)[\s]?([A-Z0-9\s]+)/i)
      if (xiaomiMatch) {
        deviceName = xiaomiMatch[0].trim()
      }
    }

    // Pattern 1: Standard Android format (Android X.X; DeviceName)
    if (!deviceName) {
      const match1 = ua.match(/Android[^;]+;\s*([^;)]+)/)
      if (match1) {
        deviceName = match1[1].trim()
      }
    }

    // Pattern 2: Build/MODEL format
    if (!deviceName || deviceName.length <= 2) {
      const match2 = ua.match(/Build\/([A-Z0-9]+)/)
      if (match2) {
        deviceName = match2[1]
      }
    }

    // Pattern 3: Generic brand detection (last resort)
    if (!deviceName || deviceName.length <= 2) {
      if (ua.includes('Samsung')) deviceName = 'Samsung Device'
      else if (ua.includes('Huawei')) deviceName = 'Huawei Device'
      else if (ua.includes('Xiaomi')) deviceName = 'Xiaomi Device'
      else if (ua.includes('OnePlus')) deviceName = 'OnePlus Device'
      else if (ua.includes('OPPO')) deviceName = 'OPPO Device'
      else if (ua.includes('Vivo')) deviceName = 'Vivo Device'
      else if (ua.includes('Pixel')) deviceName = 'Google Pixel'
      else if (ua.includes('Motorola')) deviceName = 'Motorola Device'
      else if (ua.includes('LG-')) {
        const lgMatch = ua.match(/LG-([A-Z0-9]+)/)
        deviceName = lgMatch ? `LG ${lgMatch[1]}` : 'LG Device'
      }
    }

    // If still too short or empty, use generic
    return (deviceName && deviceName.length > 2) ? deviceName : 'Android Device'
  }

  return ''
}

/**
 * Detects and returns detailed device information
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    // Server-side rendering - return default values
    return {
      userAgent: '',
      platform: '',
      browserName: '',
      browserVersion: '',
      osName: '',
      osVersion: '',
      deviceType: 'unknown',
      deviceModel: '',
      screenResolution: '',
      viewportSize: '',
      timezone: '',
      language: '',
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      isBot: false
    }
  }

  const ua = navigator.userAgent
  const browser = parseBrowser(ua)
  const os = parseOS(ua)
  const deviceModel = parseDevice(ua, window.screen.width, window.screen.height, window.devicePixelRatio)

  const isMobile = /mobile/i.test(ua) || window.innerWidth <= 768
  const isTablet = /tablet|ipad/i.test(ua) || (window.innerWidth > 768 && window.innerWidth <= 1024)
  const isDesktop = !isMobile && !isTablet

  // Determine device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'unknown'
  if (isMobile) deviceType = 'mobile'
  else if (isTablet) deviceType = 'tablet'
  else if (isDesktop) deviceType = 'desktop'

  // Check if it's a bot/crawler
  const isBot = /bot|crawler|spider|crawling/i.test(ua)

  return {
    userAgent: ua,
    platform: navigator.platform || os.name || '',
    browserName: browser.name,
    browserVersion: browser.version,
    osName: os.name,
    osVersion: os.version,
    deviceType,
    deviceModel,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language || '',
    isMobile,
    isTablet,
    isDesktop,
    isBot
  }
}

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

/**
 * Get session analytics summary
 */
export async function getSessionAnalytics(timeframe: { startDate: string, endDate: string }) {
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
