'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
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

    router.push('/booking')
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