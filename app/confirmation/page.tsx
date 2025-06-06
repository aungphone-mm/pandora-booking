import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ConfirmationPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

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