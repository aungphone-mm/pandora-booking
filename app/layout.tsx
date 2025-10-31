import './globals.css'
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pandora Beauty Salon',
  description: 'Book your beauty appointment at Pandora Salon',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

async function getUser() {
  try {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn('Auth error:', error.message)
      return { user: null, profile: null }
    }

    if (!user) {
      return { user: null, profile: null }
    }

    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.warn('Profile error:', profileError.message)
      return { user, profile: null }
    }

    return { user, profile: profileData }
  } catch (error) {
    console.error('Layout auth error:', error)
    return { user: null, profile: null }
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getUser()

  return (
    <html lang="en">
      <body className={inter.className}>
        <header style={{
          backgroundColor: '#ec4899',
          color: 'white'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <Link 
                href="/" 
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: 'white',
                  textDecoration: 'none'
                }}
              >
                Pandora Beauty Salon
              </Link>
              <nav style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <Link 
                  href="/booking" 
                  style={{
                    color: 'white',
                    textDecoration: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px'
                  }}
                >
                  Book Now
                </Link>
                {user ? (
                  <>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.875rem'
                    }}>
                      Welcome, {profile?.full_name || user.email?.split('@')[0] || 'User'}!
                    </span>
                    <Link 
                      href="/account" 
                      style={{
                        color: 'white',
                        textDecoration: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px'
                      }}
                    >
                      My Account
                    </Link>
                    {profile?.is_admin && (
                      <Link 
                        href="/admin" 
                        style={{
                          color: 'white',
                          textDecoration: 'none',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        Admin
                      </Link>
                    )}
                    <form action="/api/auth/signout" method="POST" style={{margin: 0}}>
                      <button 
                        style={{
                          color: 'white',
                          backgroundColor: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link 
                      href="/auth/login" 
                      style={{
                        color: 'white',
                        textDecoration: 'none',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.3)'
                      }}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/auth/register" 
                      style={{
                        backgroundColor: 'white',
                        color: '#ec4899',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}
                    >
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
        <main style={{
          minHeight: '100vh',
          backgroundColor: '#f9fafb'
        }}>
          {children}
        </main>
      </body>
    </html>
  )
}