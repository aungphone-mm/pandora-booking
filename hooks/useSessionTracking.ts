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
        }
      } catch (error) {
        console.error('Error initializing session tracking:', error)
      }
    }

    initializeTracking()

    // Track when user leaves the page
    const handleBeforeUnload = () => {
      if (sessionId) {
        endSession(sessionId)
      }
    }

    // Track when page visibility changes (user switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sessionId) {
        endSession(sessionId)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      mounted = false
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (sessionId) {
        endSession(sessionId)
      }
    }
  }, [])

  return { sessionId, trackPageView: (page: string) => trackPageView(page) }
}
