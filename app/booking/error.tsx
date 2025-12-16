'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function BookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Booking error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-2xl bg-white p-10 rounded-lg shadow-md text-center">
        <div className="text-5xl mb-4">
          📅
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Booking System Error
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          We couldn't load the booking form. This might be a temporary issue. Please try again in a moment.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-100 p-3 rounded mb-6 text-left">
            <p className="text-xs text-red-800 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="bg-pink-600 text-white px-6 py-3 rounded font-semibold text-sm hover:bg-pink-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded font-semibold text-sm hover:bg-gray-200 transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          Need help? Contact us at <a href="tel:+1234567890" className="text-pink-600 hover:text-pink-700">+1 (234) 567-890</a>
        </p>
      </div>
    </div>
  )
}
