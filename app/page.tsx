'use client'

import Link from 'next/link'
import HomeGallery from '@/components/HomeGallery'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-[10%] -right-[5%] w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[15%] -left-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-15">
          <div className="text-base font-semibold text-pink-600 tracking-widest uppercase mb-4">
            Premium Beauty Experience
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
            Pandora Beauty Salon
          </h1>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Where beauty meets artistry. Experience world-class treatments
            in a luxurious and relaxing environment.
          </p>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed font-medium">
            အလှအပနှင့် အနုပညာ ပေါင်းစပ်ရာနေရာ။ အရည်အသွေးမြင့်ပြီး အပန်းဖြေနိုင်သော ပတ်ဝန်းကျင်တွင် ကမ္ဘာ့အဆင့်မီ အလှပြုပြင်မှုများကို တွေ့ကြုံခံစားပါ။
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-5 justify-center flex-wrap mb-5">
            <Link
              href="/booking"
              className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-10 py-4 rounded-full font-bold text-lg shadow-[0_10px_30px_rgba(236,72,153,0.3)] hover:shadow-[0_15px_40px_rgba(236,72,153,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Book Your Appointment (Booking တင်ရန်)
            </Link>
            <Link
              href="/account"
              className="bg-white text-purple-600 px-10 py-4 rounded-full font-bold text-lg shadow-[0_10px_30px_rgba(139,92,246,0.15)] border-2 border-purple-600 hover:bg-purple-600 hover:text-white hover:-translate-y-0.5 transition-all duration-300"
            >
              My Account (ကျွန်ုပ်၏အကောင့်)
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-15">
          {/* Feature 1 */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 hover:-translate-y-2 hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all duration-300">
            <div className="text-6xl mb-5 drop-shadow-md">💇‍♀️</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Expert Stylists
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              ကျွမ်းကျင်သော Stylist များ
            </p>
            <p className="text-gray-600 text-base leading-relaxed">
              Our certified professionals bring years of experience
              and passion to every service
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 hover:-translate-y-2 hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all duration-300">
            <div className="text-6xl mb-5 drop-shadow-md">✨</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Premium Products
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              အရည်အသွေးမြင့် ထုတ်ကုန်များ
            </p>
            <p className="text-gray-600 text-base leading-relaxed">
              Only the finest, salon-grade products for
              exceptional results and care
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50 hover:-translate-y-2 hover:shadow-[0_25px_70px_rgba(0,0,0,0.15)] transition-all duration-300">
            <div className="text-6xl mb-5 drop-shadow-md">🌟</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Luxurious Ambiance
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-2">
              ဇိမ်ခံပတ်ဝန်းကျင်
            </p>
            <p className="text-gray-600 text-base leading-relaxed">
              Relax in our elegant, comfortable space designed
              for your ultimate pampering
            </p>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-[30px] p-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.1)] border border-white/50">
          <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Why Choose Pandora?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-10">
            <div>
              <div className="text-5xl mb-3">📅</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Easy Online Booking
              </h4>
              <p className="text-sm text-gray-600">
                Book anytime, anywhere with our simple system
              </p>
            </div>
            <div>
              <div className="text-5xl mb-3">🎁</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Member Rewards
              </h4>
              <p className="text-sm text-gray-600">
                Exclusive perks and special offers for members
              </p>
            </div>
            <div>
              <div className="text-5xl mb-3">💖</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Personalized Care
              </h4>
              <p className="text-sm text-gray-600">
                Tailored treatments for your unique needs
              </p>
            </div>
            <div>
              <div className="text-5xl mb-3">⭐</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                5-Star Experience
              </h4>
              <p className="text-sm text-gray-600">
                Consistently rated excellent by our clients
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Section */}
      <HomeGallery />
    </div>
  )
}
