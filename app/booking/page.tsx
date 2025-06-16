import { createClient } from '@/lib/supabase/server'
import SinglePageBookingForm from '@/components/SinglePageBookingForm'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

export default async function BookingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      {/* Back to Home Link */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px'
        }}>
          <a 
            href="/" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: '#ec4899',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>
      
      {/* Single Page Booking Form */}
      <SinglePageBookingForm user={user} />
      
      {/* Contact Information */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '48px 0'
      }}>
        <div style={{
          maxWidth: '1024px',
          margin: '0 auto',
          padding: '0 16px',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '16px'
            }}>Need Assistance?</h3>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              fontSize: '1.125rem'
            }}>
              Our friendly team is here to help you with any questions about our services or booking process.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '24px'
            }}>
              <a 
                href="tel:+1234567890" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ec4899',
                  color: 'white',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Call (123) 456-7890
              </a>
              <a 
                href="mailto:info@pandorabeauty.com" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  padding: '16px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}