'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ConfirmationPage() {
  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '48px 16px'
    }}>
      <div style={{
        maxWidth: '512px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
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
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '16px'
        }}>
          Booking Confirmed!
        </h1>
        
        <p style={{
          color: '#6b7280',
          marginBottom: '32px',
          fontSize: '1.125rem'
        }}>
          Thank you for booking with Pandora Beauty Salon. 
          We've sent a confirmation email with your appointment details.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link 
            href="/" 
            style={{
              display: 'inline-block',
              backgroundColor: '#ec4899',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Return to Home
          </Link>
          <Link 
            href="/account" 
            style={{
              display: 'inline-block',
              color: '#ec4899',
              textDecoration: 'none'
            }}
          >
            View My Appointments
          </Link>
        </div>
      </div>
    </div>
  )
}