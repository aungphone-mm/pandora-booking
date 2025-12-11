/**
 * Session Tracker - Main entry point
 *
 * This file exports all session tracking functionality.
 * The implementation has been modularized into separate files:
 * - types.ts: Type definitions
 * - deviceDetection.ts: Browser/OS/device parsing
 * - sessionManager.ts: Session CRUD operations
 * - sessionAnalytics.ts: Analytics and reporting
 */

// Export types
export type { DeviceInfo, SessionData, SessionAnalytics } from './types'

// Export device detection functions
export {
  parseBrowser,
  parseOS,
  parseDevice,
  detectiPhoneModel,
  detectiPadModel,
  getDeviceInfo
} from './deviceDetection'

// Export session management functions
export { trackSession, endSession, trackPageView } from './sessionManager'

// Export analytics functions
export { getSessionAnalytics } from './sessionAnalytics'
