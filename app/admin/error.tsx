'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="max-w-2xl bg-white p-10 rounded-lg shadow-md text-center">
        <div className="text-5xl mb-4">
          🚨
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Admin Panel Error
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          An error occurred while loading the admin panel. This might be due to a database connection issue or invalid data.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-100 p-3 rounded mb-6 text-left">
            <p className="text-xs text-red-800 font-mono break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-[11px] text-red-800 font-mono mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={reset}
            className="bg-pink-600 text-white px-6 py-3 rounded font-semibold text-sm hover:bg-pink-700 transition-colors"
          >
            Retry
          </button>
          <Link
            href="/admin"
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded font-semibold text-sm hover:bg-gray-200 transition-colors inline-block"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/"
            className="text-gray-600 px-6 py-3 underline text-sm hover:text-gray-800 transition-colors inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
