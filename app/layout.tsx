import './globals.css'
import { Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Pandora Beauty Salon',
  description: 'Book your beauty appointment at Pandora Salon',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single() : { data: null }

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
                          borderRadius: '4px'
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
                          border: 'none',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '4px'
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
                        borderRadius: '4px'
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