import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const cookieStore = cookies()

    // 1. Try to sign out with Supabase (don't fail if this errors)
    try {
      await supabase.auth.signOut()
    } catch (signOutError) {
      console.warn('Supabase signOut failed:', signOutError)
      // Continue with cookie cleanup even if signOut fails
    }

    // 2. Clear all authentication-related cookies
    const authCookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'access_token',
      'refresh_token',
      // Add any other auth cookie names your app might use
    ]

    // Create response with redirect
    const redirectUrl = new URL('/', request.url)
    const response = NextResponse.redirect(redirectUrl, { status: 303 })

    // Clear cookies in the response
    authCookieNames.forEach(cookieName => {
      response.cookies.delete(cookieName)
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return response
  } catch (error) {
    console.error('Signout error:', error)
    
    // Even if there's an error, redirect to home and clear cookies
    const redirectUrl = new URL('/', request.url)
    const response = NextResponse.redirect(redirectUrl, { status: 303 })
    
    // Clear cookies anyway
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    
    return response
  }
}