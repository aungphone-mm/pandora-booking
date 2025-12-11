/**
 * Type definitions for session tracking
 */

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

export interface SessionAnalytics {
  totalSessions: number
  mobileSessions: number
  tabletSessions: number
  desktopSessions: number
  registeredUsers: number
  guestSessions: number
  mobilePercentage: string
  browserCount: Record<string, number>
  osCount: Record<string, number>
  deviceModelCount: Record<string, number>
  sessions: any[]
}
