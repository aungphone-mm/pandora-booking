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

    router.push('/booking')
    router.refresh()
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
    <div style={{
      maxWidth: '448px',
      margin: '32px auto',
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '24px',
        textAlign: 'center'
      }}>Login</h2>

      {error === 'email_not_confirmed' ? (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '1.25rem', marginRight: '8px' }}>📧</span>
            <h3 style={{
              color: '#92400e',
              fontWeight: '600',
              fontSize: '1rem'
            }}>Email Confirmation Required</h3>
          </div>
          <p style={{
            color: '#92400e',
            fontSize: '0.875rem',
            marginBottom: '12px',
            lineHeight: '1.5'
          }}>
            Please check your email and click the confirmation link to activate your account. 
            Haven't received the email?
          </p>
          <button
            onClick={resendConfirmation}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Resend Confirmation Email
          </button>
        </div>
      ) : error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{ color: '#b91c1c', fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#374151',
            marginBottom: '8px'
          }}>Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            color: '#374151',
            marginBottom: '8px'
          }}>Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? '#9ca3af' : '#ec4899',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '600'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p style={{
        marginTop: '16px',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        Don't have an account?{' '}
        <Link 
          href="/auth/register" 
          style={{
            color: '#ec4899',
            textDecoration: 'none'
          }}
        >
          Register here
        </Link>
      </p>

      <div style={{
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '0.875rem',
          marginBottom: '12px'
        }}>
          Want to book without an account?
        </p>
        <Link
          href="/booking"
          style={{
            display: 'block',
            textAlign: 'center',
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          Continue as Guest
        </Link>
      </div>
    </div>
  )
}