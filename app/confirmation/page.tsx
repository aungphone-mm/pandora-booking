'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ConfirmationPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Booking Confirmed!
        </h1>
        
        <p className="text-gray-600 mb-8">
          Thank you for booking with Pandora Beauty Salon. 
          We've sent a confirmation email with your appointment details.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/" 
            className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition"
          >
            Return to Home
          </Link>
          <br />
          <Link 
            href="/account" 
            className="inline-block text-pink-600 hover:text-pink-700"
          >
            View My Appointments
          </Link>
        </div>
      </div>
    </div>
  )
}
