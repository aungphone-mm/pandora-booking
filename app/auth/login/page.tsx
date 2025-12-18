'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        // Check if the error is related to email confirmation
        if (signInError.message.includes('email not confirmed') ||
            signInError.message.includes('Email not confirmed')) {
          setError('email_not_confirmed')
        } else {
          setError(signInError.message)
        }
        setLoading(false)
        return
      }

      // Ensure session is established before redirect
      if (data.session) {
        // Add a small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 100))

        // Force a hard navigation to ensure cookies are sent
        window.location.href = '/booking'
      } else {
        setError('Login failed - no session created')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const resendConfirmation = async () => {
    if (!formData.email) {
      alert('Please enter your email address first')
      return
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email
    })

    if (error) {
      alert('Error sending confirmation email: ' + error.message)
    } else {
      alert('Confirmation email sent! Please check your inbox.')
    }
  }

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

      {error === 'email_not_confirmed' ? (
        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <span className="text-xl mr-2">📧</span>
            <h3 className="text-yellow-900 font-semibold text-base">Email Confirmation Required</h3>
          </div>
          <p className="text-yellow-900 text-sm mb-3 leading-relaxed">
            Please check your email and click the confirmation link to activate your account.
            Haven't received the email?
          </p>
          <button
            onClick={resendConfirmation}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium"
          >
            Resend Confirmation Email
          </button>
        </div>
      ) : error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
          />
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-700">Password</label>
            <Link
              href="/auth/forgot-password"
              className="text-sm text-pink-600 hover:text-pink-700"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-600">
        Don't have an account?{' '}
        <Link
          href="/auth/register"
          className="text-pink-600 hover:text-pink-700"
        >
          Register here
        </Link>
      </p>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-center text-gray-600 text-sm mb-3">
          Want to book without an account?
        </p>
        <Link
          href="/booking"
          className="block text-center bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          Continue as Guest
        </Link>
      </div>
    </div>
  )
}
