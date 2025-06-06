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
      <div style={{
        maxWidth: '448px',
        margin: '32px auto',
        padding: '24px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        marginLeft: '16px',
        marginRight: '16px',
        textAlign: 'center'
      }}>
        {/* Success Icon */}
        <div style={{ marginBottom: '24px' }}>
          <svg 
            style={{
              width: '64px',
              height: '64px',
              color: '#10b981',
              margin: '0 auto'
            }}
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

        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '16px',
          color: '#111827'
        }}>Check Your Email!</h2>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '8px',
          lineHeight: '1.6'
        }}>
          We've sent a confirmation email to:
        </p>
        
        <p style={{
          fontWeight: '600',
          color: '#111827',
          marginBottom: '16px'
        }}>
          {formData.email}
        </p>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '24px',
          lineHeight: '1.6',
          fontSize: '0.875rem'
        }}>
          Please click the confirmation link in your email to activate your account. 
          Once confirmed, you can login and access all features.
        </p>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '24px'
        }}>
          <p style={{
            color: '#92400e',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            📧 Don't forget to check your spam/junk folder if you don't see the email!
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Go to Login
          </button>
          
          <button
            onClick={() => router.push('/booking')}
            style={{
              backgroundColor: 'transparent',
              color: '#6b7280',
              padding: '8px 16px',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Continue Booking as Guest
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '448px',
      margin: '16px auto',
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
      marginLeft: '16px',
      marginRight: '16px'
    }}>
      <h2 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        marginBottom: '16px',
        textAlign: 'center'
      }}>Create Account</h2>
      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#374151',
            marginBottom: '8px'
          }}>Full Name</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
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
        <div style={{ marginBottom: '16px' }}>
          <label style={{
            display: 'block',
            color: '#374151',
            marginBottom: '8px'
          }}>Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
    </div>
  )
}