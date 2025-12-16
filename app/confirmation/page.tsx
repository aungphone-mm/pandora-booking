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
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-xl text-center">
        {/* Search Section */}
        {showSearch && !bookingData && (
          <div className="mb-8">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-blue-500 mx-auto"
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

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Find Your Booking
            </h1>

            <p className="text-gray-600 mb-6">
              Enter your booking ID to retrieve your appointment details
            </p>

            <form onSubmit={handleSearch}>
              <div className="mb-2">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Paste your full Booking ID here"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm text-center font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-gray-600 mb-4 text-center">
                Copy the full Booking ID from your confirmation (e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890)
              </p>

              {searchError && (
                <div className="p-3 bg-red-100 text-red-800 rounded-lg mb-4 text-sm">
                  {searchError}
                </div>
              )}

              <button
                type="submit"
                disabled={searching || !searchId}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
              >
                {searching ? 'Searching...' : 'Search Booking'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-600 text-sm mb-4">
                Don't have a booking yet?
              </p>
              <Link
                href="/booking"
                className="inline-block text-blue-500 hover:text-blue-600 font-semibold"
              >
                Book an Appointment →
              </Link>
            </div>
          </div>
        )}

        {/* Success Icon and Title (shown when booking data exists) */}
        {bookingData && (
          <>
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-green-500 mx-auto"
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

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Booking Confirmed!
            </h1>
          </>
        )}

        {/* Booking Details Section */}
        {bookingData && (
          <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              📋 Your Booking Details
            </h2>

            <div className="space-y-3">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-semibold text-gray-700">Booking ID:</span>
                <div>
                  <div className="text-gray-600 font-mono text-xs break-all bg-gray-50 p-1.5 rounded border border-gray-200">
                    {bookingData.id}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bookingData.id)
                      alert('Booking ID copied to clipboard!')
                    }}
                    className="mt-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    📋 Copy ID
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-semibold text-gray-700">Name:</span>
                <span className="text-gray-600">{bookingData.customerName}</span>
              </div>

              {bookingData.customerEmail && (
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span className="text-gray-600">{bookingData.customerEmail}</span>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-semibold text-gray-700">Phone:</span>
                <span className="text-gray-600">{bookingData.customerPhone}</span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-semibold text-gray-700">
                  Service{services.length !== 1 ? 's' : ''}:
                </span>
                <div>
                  {services.length > 0 ? (
                    services.map((service) => (
                      <div key={service.id} className="mb-1">
                        <span className="text-gray-600">
                          {service.name} ({service.duration} min - ${service.price})
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 italic text-sm">
                      No services found
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-semibold text-gray-700">Date:</span>
                <span className="text-gray-600">
                  {format(new Date(bookingData.appointmentDate), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="font-semibold text-gray-700">Time:</span>
                <span className="text-gray-600">{bookingData.appointmentTime}</span>
              </div>

              {services.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-semibold text-gray-700">Total Duration:</span>
                  <span className="text-gray-600">
                    {services.reduce((sum, s) => sum + s.duration, 0)} minutes
                  </span>
                </div>
              )}

              {products.length > 0 && (
                <div className="grid grid-cols-[140px_1fr] gap-2">
                  <span className="font-semibold text-gray-700">
                    Add-on Product{products.length > 1 ? 's' : ''}:
                  </span>
                  <div>
                    {products.map((product) => (
                      <div key={product.id} className="mb-1">
                        <span className="text-gray-600">
                          {product.name} (${product.price})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[140px_1fr] gap-2 pt-3 border-t-2 border-gray-200 mt-2">
                <span className="font-bold text-gray-900 text-lg">Total Price:</span>
                <span className="font-bold text-pink-600 text-lg">
                  ${bookingData.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-blue-800 text-sm font-medium">
                💡 Please save this information for your records. Please screenshot!
              </p>
            </div>
          </div>
        )}

        {/* Search Another Booking Button */}
        {bookingData && (
          <div className="mt-4 mb-6">
            <button
              onClick={() => {
                setBookingData(null)
                setServices([])
                setProducts([])
                setSearchId('')
                setSearchError(null)
                setShowSearch(true)
              }}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              🔍 Search Another Booking
            </button>
          </div>
        )}

        {user ? (
          // Registered user message
          <>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              Thank you for booking with Pandora Beauty Salon!
              We've sent a confirmation email with your appointment details to <strong>{user.email}</strong>.
            </p>

            <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm font-medium">
                ✅ As a registered member, you can view and manage all your appointments in your account dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/account"
                className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                View My Appointments
              </Link>
              <Link
                href="/"
                className="inline-block text-pink-600 hover:text-pink-700"
              >
                Return to Home
              </Link>
            </div>
          </>
        ) : (
          // Guest user message
          <>
            <p className="text-gray-600 mb-4 text-lg leading-relaxed">
              Your appointment has been successfully recorded!
              We've received your booking request and will process it shortly.
            </p>

            <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
              <p className="text-yellow-900 text-sm font-medium mb-2">
                ⚠️ Important Notice
              </p>
              <p className="text-yellow-900 text-sm leading-relaxed">
                Since you booked as a guest, you won't be able to view or manage your appointments online.
                For full access to your booking history and account features, please create an account.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-6">
              <h3 className="text-blue-900 text-base font-semibold mb-2">
                Create an Account for Better Experience
              </h3>
              <ul className="text-blue-900 text-sm text-left leading-relaxed pl-4">
                <li>View all your appointments in one place</li>
                <li>Receive email confirmations and reminders</li>
                <li>Easy rebooking and appointment management</li>
                <li>Exclusive member offers and updates</li>
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/auth/register"
                className="inline-block bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                Create Account Now
              </Link>
              <Link
                href="/auth/login"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                I Already Have an Account
              </Link>
              <Link
                href="/"
                className="inline-block text-pink-600 hover:text-pink-700"
              >
                Return to Home
              </Link>
            </div>
          </>
        )}

        {/* Contact Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Need Help?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            If you have any questions about your appointment, please contact us:
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <a
              href="tel:+1234567890"
              className="inline-flex items-center text-pink-600 hover:text-pink-700 text-sm font-medium"
            >
              📞 (123) 456-7890
            </a>
            <a
              href="mailto:info@pandorabeauty.com"
              className="inline-flex items-center text-pink-600 hover:text-pink-700 text-sm font-medium"
            >
              ✉️ info@pandorabeauty.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
