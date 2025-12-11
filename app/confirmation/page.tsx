'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'

interface BookingData {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone: string
  appointmentDate: string
  appointmentTime: string
  totalPrice: number
  serviceIds: string[]
  productIds?: string[]
}

interface Service {
  id: string
  name: string
  price: number
  duration: number
}

interface Product {
  id: string
  name: string
  price: number
}

export default function ConfirmationPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Search functionality
  const [searchId, setSearchId] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Get booking data from sessionStorage
    const lastBooking = sessionStorage.getItem('lastBooking')
    if (lastBooking) {
      const booking: BookingData = JSON.parse(lastBooking)
      console.log('Loading from sessionStorage:', booking)
      setBookingData(booking)

      // Fetch services details
      if (booking.serviceIds && booking.serviceIds.length > 0) {
        console.log('Fetching services for IDs:', booking.serviceIds)
        supabase
          .from('services')
          .select('id, name, price, duration')
          .in('id', booking.serviceIds)
          .then(({ data, error }) => {
            console.log('Services fetched from DB:', data, 'Error:', error)
            if (data) {
              setServices(data)
              console.log('Services state updated to:', data)
            }
          })
      }

      // Fetch products details
      if (booking.productIds && booking.productIds.length > 0) {
        console.log('Fetching products for IDs:', booking.productIds)
        supabase
          .from('products')
          .select('id, name, price')
          .in('id', booking.productIds)
          .then(({ data, error }) => {
            console.log('Products fetched from DB:', data, 'Error:', error)
            if (data) {
              setProducts(data)
              console.log('Products state updated to:', data)
            }
          })
      }

      // Clear the sessionStorage after reading
      sessionStorage.removeItem('lastBooking')
    } else {
      // No booking in sessionStorage, show search by default
      console.log('No sessionStorage data, showing search')
      setShowSearch(true)
    }
  }, [])

  // Monitor services and products state changes
  useEffect(() => {
    console.log('🔄 Services state changed:', services)
  }, [services])

  useEffect(() => {
    console.log('🔄 Products state changed:', products)
  }, [products])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    setSearchError(null)

    try {
      // Clean up the booking ID (remove spaces, make lowercase for UUID)
      const cleanedId = searchId.trim().toLowerCase()

      console.log('🔍 Searching for booking ID:', cleanedId)

      const response = await fetch(`/api/bookings/search?id=${encodeURIComponent(cleanedId)}`)

      console.log('Search response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('Search error:', error)
        throw new Error(error.error || 'Booking not found')
      }

      const data = await response.json()
      console.log('Booking found:', data)
      console.log('Services:', data.services)
      console.log('Products:', data.products)

      // Set booking data
      setBookingData({
        id: data.id,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        totalPrice: data.totalPrice,
        serviceIds: data.services?.map((s: any) => s.id) || [],
        productIds: data.products?.map((p: any) => p.id) || []
      })

      // Set services and products
      setServices(data.services || [])
      setProducts(data.products || [])

      console.log('Services state set to:', data.services || [])
      console.log('Products state set to:', data.products || [])

      // Hide search after successful search
      setShowSearch(false)
    } catch (err: any) {
      console.error('Booking search failed:', err)
      setSearchError(err.message || 'Failed to find booking. Please check the Booking ID and try again.')
    } finally {
      setSearching(false)
    }
  }

  // Log current state before rendering
  console.log('🎨 Rendering with state:', {
    hasBookingData: !!bookingData,
    servicesCount: services.length,
    productsCount: products.length,
    bookingDataServiceIds: bookingData?.serviceIds?.length || 0
  })

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
        {/* Search Section */}
        {showSearch && !bookingData && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ marginBottom: '24px' }}>
              <svg
                style={{
                  width: '64px',
                  height: '64px',
                  color: '#3b82f6',
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '16px'
            }}>
              Find Your Booking
            </h1>

            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              fontSize: '1rem'
            }}>
              Enter your booking ID to retrieve your appointment details
            </p>

            <form onSubmit={handleSearch}>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Paste your full Booking ID here"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                Copy the full Booking ID from your confirmation (e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890)
              </p>

              {searchError && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.875rem'
                }}>
                  {searchError}
                </div>
              )}

              <button
                type="submit"
                disabled={searching || !searchId}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  backgroundColor: searching || !searchId ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: searching || !searchId ? 'not-allowed' : 'pointer'
                }}
              >
                {searching ? 'Searching...' : 'Search Booking'}
              </button>
            </form>

            <div style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{
                color: '#6b7280',
                fontSize: '0.875rem',
                marginBottom: '16px'
              }}>
                Don't have a booking yet?
              </p>
              <Link
                href="/booking"
                style={{
                  display: 'inline-block',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Book an Appointment →
              </Link>
            </div>
          </div>
        )}

        {/* Success Icon and Title (shown when booking data exists) */}
        {bookingData && (
          <>
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
          </>
        )}

        {/* Booking Details Section */}
        {bookingData && (
          <div style={{
            backgroundColor: '#f9fafb',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              📋 Your Booking Details
            </h2>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '8px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Booking ID:</span>
                <div>
                  <div style={{
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    backgroundColor: '#f9fafb',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {bookingData.id}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bookingData.id)
                      alert('Booking ID copied to clipboard!')
                    }}
                    style={{
                      marginTop: '4px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Copy ID
                  </button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '8px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Name:</span>
                <span style={{ color: '#6b7280' }}>{bookingData.customerName}</span>
              </div>

              {bookingData.customerEmail && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: '8px'
                }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Email:</span>
                  <span style={{ color: '#6b7280' }}>{bookingData.customerEmail}</span>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '8px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Phone:</span>
                <span style={{ color: '#6b7280' }}>{bookingData.customerPhone}</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '8px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>
                  Service{services.length !== 1 ? 's' : ''}:
                </span>
                <div>
                  {services.length > 0 ? (
                    services.map((service) => (
                      <div key={service.id} style={{ marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>
                          {service.name} ({service.duration} min - ${service.price})
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem' }}>
                      No services found
                    </span>
                  )}
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '8px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Date:</span>
                <span style={{ color: '#6b7280' }}>
                  {format(new Date(bookingData.appointmentDate), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '8px'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>Time:</span>
                <span style={{ color: '#6b7280' }}>{bookingData.appointmentTime}</span>
              </div>

              {services.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: '8px'
                }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Total Duration:</span>
                  <span style={{ color: '#6b7280' }}>
                    {services.reduce((sum, s) => sum + s.duration, 0)} minutes
                  </span>
                </div>
              )}

              {products.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '140px 1fr',
                  gap: '8px'
                }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>
                    Add-on Product{products.length > 1 ? 's' : ''}:
                  </span>
                  <div>
                    {products.map((product) => (
                      <div key={product.id} style={{ marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>
                          {product.name} (${product.price})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                gap: '8px',
                paddingTop: '12px',
                borderTop: '2px solid #e5e7eb',
                marginTop: '8px'
              }}>
                <span style={{ fontWeight: '700', color: '#111827', fontSize: '1.125rem' }}>Total Price:</span>
                <span style={{ fontWeight: '700', color: '#ec4899', fontSize: '1.125rem' }}>
                  ${bookingData.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#dbeafe',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{
                color: '#1e40af',
                fontSize: '0.875rem',
                fontWeight: '500',
                margin: 0
              }}>
                💡 Please save this information for your records.Please screenshot!
              </p>
            </div>
          </div>
        )}

        {/* Search Another Booking Button */}
        {bookingData && (
          <div style={{ marginTop: '16px', marginBottom: '24px' }}>
            <button
              onClick={() => {
                setBookingData(null)
                setServices([])
                setProducts([])
                setSearchId('')
                setSearchError(null)
                setShowSearch(true)
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
            >
              🔍 Search Another Booking
            </button>
          </div>
        )}

        {user ? (
          // Registered user message
          <>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              fontSize: '1.125rem',
              lineHeight: '1.6'
            }}>
              Thank you for booking with Pandora Beauty Salon!
              We've sent a confirmation email with your appointment details to <strong>{user.email}</strong>.
            </p>
            
            <div style={{
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: '#166534',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                ✅ As a registered member, you can view and manage all your appointments in your account dashboard.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link 
                href="/account" 
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
                View My Appointments
              </Link>
              <Link 
                href="/" 
                style={{
                  display: 'inline-block',
                  color: '#ec4899',
                  textDecoration: 'none'
                }}
              >
                Return to Home
              </Link>
            </div>
          </>
        ) : (
          // Guest user message
          <>
            <p style={{
              color: '#6b7280',
              marginBottom: '16px',
              fontSize: '1.125rem',
              lineHeight: '1.6'
            }}>
              Your appointment has been successfully recorded! 
              We've received your booking request and will process it shortly.
            </p>
            
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                color: '#92400e',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                ⚠️ Important Notice
              </p>
              <p style={{
                color: '#92400e',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                Since you booked as a guest, you won't be able to view or manage your appointments online. 
                For full access to your booking history and account features, please create an account.
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #7dd3fc',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <h3 style={{
                color: '#0c4a6e',
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Create an Account for Better Experience
              </h3>
              <ul style={{
                color: '#0c4a6e',
                fontSize: '0.875rem',
                textAlign: 'left',
                lineHeight: '1.5',
                paddingLeft: '16px'
              }}>
                <li>View all your appointments in one place</li>
                <li>Receive email confirmations and reminders</li>
                <li>Easy rebooking and appointment management</li>
                <li>Exclusive member offers and updates</li>
              </ul>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link 
                href="/auth/register" 
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
                Create Account Now
              </Link>
              <Link 
                href="/auth/login" 
                style={{
                  display: 'inline-block',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                I Already Have an Account
              </Link>
              <Link 
                href="/" 
                style={{
                  display: 'inline-block',
                  color: '#ec4899',
                  textDecoration: 'none'
                }}
              >
                Return to Home
              </Link>
            </div>
          </>
        )}

        {/* Contact Information */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '12px'
          }}>
            Need Help?
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            marginBottom: '16px'
          }}>
            If you have any questions about your appointment, please contact us:
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <a 
              href="tel:+1234567890" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#ec4899',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              📞 (123) 456-7890
            </a>
            <a 
              href="mailto:info@pandorabeauty.com" 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#ec4899',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              ✉️ info@pandorabeauty.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}