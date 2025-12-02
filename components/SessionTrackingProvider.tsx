'use client'

import { useSessionTracking } from '@/hooks/useSessionTracking'

export default function SessionTrackingProvider({ children }: { children: React.ReactNode }) {
  // Initialize session tracking
  useSessionTracking()

  return <>{children}</>
}
