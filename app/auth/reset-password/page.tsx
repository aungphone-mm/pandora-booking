'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    // Check for error parameters in URL (from Supabase redirect)
    const hash = window.location.hash
    const searchParams = new URLSearchParams(window.location.search)

    // Check URL parameters for errors
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const errorCode = searchParams.get('error_code')

    // Also check hash fragment for errors
    const hashParams = new URLSearchParams(hash.substring(1))
    const hashError = hashParams.get('error')
    const hashErrorDescription = hashParams.get('error_description')
    const hashErrorCode = hashParams.get('error_code')

    if (errorParam || hashError) {
      const code = errorCode || hashErrorCode
      const description = errorDescription || hashErrorDescription

      if (code === 'otp_expired' || description?.includes('expired')) {
        setError('This password reset link has expired. Reset links are valid for 60 minutes. Please request a new one.')
      } else if (code === 'otp_disabled' || description?.includes('invalid')) {
        setError('This password reset link is invalid or has already been used. Please request a new one.')
      } else {
        setError(description || 'Invalid reset link. Please request a new password reset.')
      }
      return
    }

    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidToken(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }
    checkSession()
  }, [supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: any) {
      console.error('Password update error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!validToken && !error) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <span className="text-xl mr-2">✅</span>
            <h3 className="text-green-900 font-semibold text-base">Password Reset Successful</h3>
          </div>
          <p className="text-green-900 text-sm mb-3 leading-relaxed">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <p className="text-green-800 text-xs">
            Redirecting to login page in 3 seconds...
          </p>
        </div>
      ) : !validToken ? (
        <>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <p className="text-gray-600 text-sm mb-6">
            Enter your new password below. Make sure it's at least 6 characters long.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <Link
          href="/auth/login"
          className="text-pink-600 hover:text-pink-700 text-sm"
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  )
}
