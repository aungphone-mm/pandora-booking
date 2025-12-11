'use client'

import Link from 'next/link'
import HomeGallery from '@/components/HomeGallery'

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #e0e7ff 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '80px 24px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '60px'
        }}>
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#ec4899',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            Premium Beauty Experience
          </div>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '24px',
            lineHeight: '1.2'
          }}>
            Pandora Beauty Salon
          </h1>
          <p style={{
            fontSize: '1.5rem',
            color: '#4b5563',
            maxWidth: '700px',
            margin: '0 auto 40px',
            lineHeight: '1.6'
          }}>
            Where beauty meets artistry. Experience world-class treatments
            in a luxurious and relaxing environment.
          </p>
          <p style={{
            fontSize: '1.25rem',
            color: '#6b7280',
            maxWidth: '700px',
            margin: '0 auto 40px',
            lineHeight: '1.6',
            fontWeight: '500'
          }}>
            အလှအပနှင့် အနုပညာ ပေါင်းစပ်ရာနေရာ။ အရည်အသွေးမြင့်ပြီး အပန်းဖြေနိုင်သော ပတ်ဝန်းကျင်တွင် ကမ္ဘာ့အဆင့်မီ အလှပြုပြင်မှုများကို တွေ့ကြုံခံစားပါ။
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '20px'
          }}>
            <Link
              href="/booking"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
                padding: '18px 40px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '1.125rem',
                boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)',
                transition: 'all 0.3s ease',
                display: 'inline-block',
                border: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(236, 72, 153, 0.4)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(236, 72, 153, 0.3)'
              }}
            >
              Book Your Appointment (Booking တင်ရန်)
            </Link>
            <Link
              href="/account"
              style={{
                background: 'white',
                color: '#8b5cf6',
                padding: '18px 40px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '1.125rem',
                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.15)',
                transition: 'all 0.3s ease',
                display: 'inline-block',
                border: '2px solid #8b5cf6'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.background = '#8b5cf6'
                e.currentTarget.style.color = 'white'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.color = '#8b5cf6'
              }}
            >
              My Account (ကျွန်ုပ်၏အကောင့်)
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          {/* Feature 1 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)'
            e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.15)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}
          >
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}>💇‍♀️</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Expert Stylists
            </h3>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '8px'
            }}>
              ကျွမ်းကျင်သော Stylist များ
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Our certified professionals bring years of experience
              and passion to every service
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)'
            e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.15)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}
          >
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}>✨</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Premium Products
            </h3>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '8px'
            }}>
              အရည်အသွေးမြင့် ထုတ်ကုန်များ
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Only the finest, salon-grade products for
              exceptional results and care
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px 30px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-8px)'
            e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.15)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.1)'
          }}
          >
            <div style={{
              fontSize: '4rem',
              marginBottom: '20px',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}>🌟</div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '12px'
            }}>
              Luxurious Ambiance
            </h3>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '8px'
            }}>
              ဇိမ်ခံပတ်ဝန်းကျင်
            </p>
            <p style={{
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              Relax in our elegant, comfortable space designed
              for your ultimate pampering
            </p>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '30px',
          padding: '50px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Why Choose Pandora?
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px',
            marginTop: '40px'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📅</div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Easy Online Booking
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>
                Book anytime, anywhere with our simple system
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎁</div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Member Rewards
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>
                Exclusive perks and special offers for members
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💖</div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                Personalized Care
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>
                Tailored treatments for your unique needs
              </p>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⭐</div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                5-Star Experience
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>
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