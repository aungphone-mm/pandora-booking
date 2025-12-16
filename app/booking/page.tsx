import { createClient } from '@/lib/supabase/server'
import SinglePageBookingForm from '@/components/SinglePageBookingForm'
import Link from 'next/link'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default async function BookingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      {/* Back to Home Link */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a
            href="/"
            className="inline-flex items-center text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>

      {/* Single Page Booking Form */}
      <SinglePageBookingForm user={user} />

      {/* Contact Information */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white rounded-xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need Assistance?
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              Our friendly team is here to help you with any questions about our services or booking process.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <a
                href="tel:+1234567890"
                className="inline-flex items-center justify-center bg-pink-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                Call (123) 456-7890
              </a>
              <a
                href="mailto:info@pandorabeauty.com"
                className="inline-flex items-center justify-center bg-purple-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Get More with a Free Account - Only show for non-logged-in users */}
      {!user && (
        <div className="bg-gray-50 pb-12">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 text-white relative">
                <h3 className="text-xl font-semibold mb-2">
                  💫 Get More with a Free Account!
                </h3>
                <p className="opacity-90 text-sm leading-relaxed">
                  You're booking as a guest. Create a free account to unlock exclusive benefits!
                </p>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📅</div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Appointment History
                    </h4>
                    <p className="text-xs text-gray-600">
                      View & manage all bookings
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📧</div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Email Confirmations
                    </h4>
                    <p className="text-xs text-gray-600">
                      Automatic booking updates
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Quick Rebooking
                    </h4>
                    <p className="text-xs text-gray-600">
                      One-click repeat visits
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎁</div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Member Perks
                    </h4>
                    <p className="text-xs text-gray-600">
                      Exclusive offers & discounts
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link
                    href="/auth/register"
                    className="bg-pink-600 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-pink-700 transition-colors"
                  >
                    Create Free Account
                  </Link>
                  <Link
                    href="/auth/login"
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gray-700 transition-colors"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
