'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <span className="text-xl mr-2">✅</span>
            <h3 className="text-green-900 font-semibold text-base">Check Your Email</h3>
          </div>
          <p className="text-green-900 text-sm mb-3 leading-relaxed">
            We've sent a password reset link to <strong>{email}</strong>.
            Please check your email and click the link to reset your password.
          </p>
          <p className="text-green-800 text-xs">
            The link will expire in 60 minutes. If you don't see the email, check your spam folder.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <p className="text-gray-600 text-sm mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
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
