'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console (in production, send to error reporting service)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-lg bg-white p-10 rounded-lg shadow-md text-center">
        <div className="text-5xl mb-4">
          ⚠️
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          We encountered an unexpected error. Please try again or contact support if the problem persists.
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
      </div>
    </div>
  )
}
