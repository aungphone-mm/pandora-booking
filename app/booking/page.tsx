import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/BookingForm'
import { redirect } from 'next/navigation'

export default async function BookingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Optional: Add a back button or breadcrumb */}
        <div className="max-w-4xl mx-auto mb-6">
          <a href="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
        
        {/* Booking Form */}
        <BookingForm user={user} />
        
        {/* Optional: Add helpful information below the form */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about our services or need assistance with booking, 
              please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+1234567890" className="inline-flex items-center justify-center text-pink-600 hover:text-pink-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call (123) 456-7890
              </a>
              <a href="mailto:info@pandorabeauty.com" className="inline-flex items-center justify-center text-pink-600 hover:text-pink-700">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}