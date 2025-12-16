'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showEmailAlert, setShowEmailAlert] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          phone: formData.phone
        }
      }
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    // Check if user needs email confirmation
    if (data.user && !data.session) {
      // Email confirmation required
      setShowEmailAlert(true)
      setLoading(false)
    } else {
      // Auto-signed in (email confirmation disabled)
      router.push('/booking')
    }
  }

  if (showEmailAlert) {
    return (
      <div className="max-w-md mx-8 md:mx-auto my-8 p-6 bg-white rounded-xl shadow-xl text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-green-500 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-gray-900">Check Your Email!</h2>

        <p className="text-gray-600 mb-2 leading-relaxed">
          We've sent a confirmation email to:
        </p>

        <p className="font-semibold text-gray-900 mb-4">
          {formData.email}
        </p>

        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
          Please click the confirmation link in your email to activate your account.
          Once confirmed, you can login and access all features.
        </p>

        <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-3 mb-6">
          <p className="text-yellow-900 text-sm font-medium">
            📧 Don't forget to check your spam/junk folder if you don't see the email!
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Go to Login
          </button>

          <button
            onClick={() => router.push('/booking')}
            className="text-gray-600 px-4 py-2 underline hover:text-gray-800 transition-colors"
          >
            Continue Booking as Guest
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-4 md:mx-auto my-4 p-4 bg-white rounded-xl shadow-xl">
      <h2 className="text-xl font-bold mb-4 text-center">Create Account</h2>
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
          />
        </div>
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
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-600"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
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
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
    </div>
  )
}
