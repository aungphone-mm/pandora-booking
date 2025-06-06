'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    router.push('/booking')
    router.refresh()
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
    </div>
  )
}