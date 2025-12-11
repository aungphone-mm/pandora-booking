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
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '600px',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          🚨
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1f2937',
          marginBottom: '16px'
        }}>
          Admin Panel Error
        </h2>
        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.6'
        }}>
          An error occurred while loading the admin panel. This might be due to a database connection issue or invalid data.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            backgroundColor: '#fee2e2',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{
              fontSize: '12px',
              color: '#991b1b',
              fontFamily: 'monospace',
              wordBreak: 'break-word'
            }}>
              {error.message}
            </p>
            {error.digest && (
              <p style={{
                fontSize: '11px',
                color: '#991b1b',
                fontFamily: 'monospace',
                marginTop: '8px'
              }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={reset}
            style={{
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
          <Link
            href="/admin"
            style={{
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              padding: '12px 24px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              display: 'inline-block'
            }}
          >
            Back to Dashboard
          </Link>
          <Link
            href="/"
            style={{
              color: '#6b7280',
              padding: '12px 24px',
              textDecoration: 'underline',
              fontSize: '14px',
              display: 'inline-block'
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
