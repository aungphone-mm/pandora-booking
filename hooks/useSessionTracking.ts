'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackSession, endSession, trackPageView } from '@/lib/tracking/sessionTracker'

export function useSessionTracking() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let updateInterval: NodeJS.Timeout | null = null

    async function initializeTracking() {
      if (isTracking) return
      setIsTracking(true)

      try {
        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser()

        // Get user profile if user exists
        let userName = null
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single()

          userName = profile?.full_name || null
        }

        // Track the session
        const id = await trackSession({
          userId: user?.id,
          userEmail: user?.email,
          userName
        })

        if (mounted && id) {
          setSessionId(id)
          sessionStorage.setItem('session_start_time', new Date().toISOString())

          // Update session duration every 30 seconds while user is active
          updateInterval = setInterval(() => {
            endSession(id)
          }, 30000) // Update every 30 seconds
        }
      } catch (error) {
        console.error('Error initializing session tracking:', error)
      }
    }

    initializeTracking()

    // Track when user leaves the page (use synchronous beacon)
    const handleBeforeUnload = () => {
      const id = sessionStorage.getItem('current_session_id')
      if (id) {
        // Use sendBeacon for reliable tracking on page unload
        const sessionStart = sessionStorage.getItem('session_start_time')
        const startTime = sessionStart ? new Date(sessionStart) : new Date()
        const endTime = new Date()
        const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

        const data = JSON.stringify({
          session_id: id,
          session_end: endTime.toISOString(),
          duration_seconds: durationSeconds
        })

        // Try to send with beacon (works even when page is closing)
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/sessions/end', data)
        }
      }
    }

    // Track when page visibility changes (user switches tabs or minimizes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionId) {
        endSession(sessionId)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      if (updateInterval) {
        clearInterval(updateInterval)
      }
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (sessionId) {
        endSession(sessionId)
      }
    }
  }, [])

  return { sessionId, trackPageView: (page: string) => trackPageView(page) }
}
