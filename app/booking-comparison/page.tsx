import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/BookingForm'
import SinglePageBookingForm from '@/components/SinglePageBookingForm'

export default async function BookingComparisonPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">UI Comparison</h1>
          <p className="text-xl text-gray-600">Before vs After - Booking Form Design</p>
        </div>

        {/* Before Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-red-600 mb-2">Before (Old UI)</h2>
            <p className="text-gray-600">Basic, unstyled form with minimal visual appeal</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <BookingForm user={user} />
          </div>
        </div>

        {/* After Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-green-600 mb-2">After (Modern UI)</h2>
            <p className="text-gray-600">Modern, user-friendly single-page design</p>
          </div>
          <SinglePageBookingForm user={user} />
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-center mb-8">Improvement Highlights</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xl font-semibold text-red-600 mb-4">Old UI Issues</h4>
              <ul className="space-y-2 text-gray-700">
                <li>Plain HTML styling</li>
                <li>Poor visual hierarchy</li>
                <li>No progress indication</li>
                <li>Basic form elements</li>
                <li>No branding/luxury feel</li>
                <li>Poor mobile experience</li>
                <li>No visual feedback</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-semibold text-green-600 mb-4">New UI Features</h4>
              <ul className="space-y-2 text-gray-700">
                <li>Single-page clean layout</li>
                <li>Clean white card design</li>
                <li>Clear section organization</li>
                <li>Modern card-based design</li>
                <li>Professional styling</li>
                <li>Mobile-first responsive design</li>
                <li>Better form validation</li>
                <li>Enhanced accessibility</li>
                <li>Real-time price calculation</li>
                <li>Simplified user experience</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <a 
            href="/booking" 
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Try the New Booking Experience
          </a>
        </div>
      </div>
    </div>
  )
}