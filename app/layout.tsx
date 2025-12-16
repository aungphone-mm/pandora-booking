import './globals.css'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import InstallPWA from '@/components/InstallPWA'
import SessionTrackingProvider from '@/components/SessionTrackingProvider'

// Layout is automatically dynamic due to cookie usage in createClient()
// Individual pages can opt into static generation if they don't need auth

export const metadata = {
  title: 'Pandora Beauty Salon',
  description: 'Book your beauty appointment at Pandora Salon',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pandora Salon',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#8b5cf6',
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
      <body className="font-sans">
        <header className="bg-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <Link
                href="/"
                className="text-2xl font-bold text-white hover:text-pink-100 transition-colors"
              >
                Pandora Beauty Salon
              </Link>
              <nav className="flex gap-4 items-center flex-wrap">
                <Link
                  href="/booking"
                  className="text-white hover:bg-pink-700 px-3 py-2 rounded transition-colors"
                >
                  Book Now
                </Link>
                <Link
                  href="/confirmation"
                  className="text-white hover:bg-pink-700 px-3 py-2 rounded flex items-center gap-1 transition-colors"
                >
                  🔍 Search Booking
                </Link>
                {user ? (
                  <>
                    <span className="text-white/80 text-sm">
                      Welcome, {profile?.full_name || user.email?.split('@')[0] || 'User'}!
                    </span>
                    <Link
                      href="/account"
                      className="text-white hover:bg-pink-700 px-3 py-2 rounded transition-colors"
                    >
                      My Account
                    </Link>
                    {profile?.is_admin && (
                      <Link
                        href="/admin"
                        className="text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded transition-colors"
                      >
                        Admin
                      </Link>
                    )}
                    <form action="/api/auth/signout" method="POST" className="m-0">
                      <button
                        className="text-white border border-white/30 hover:bg-white/10 px-3 py-1.5 rounded text-sm transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-white border border-white/30 hover:bg-white/10 px-3 py-2 rounded transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      className="bg-white text-pink-600 px-4 py-2 rounded font-semibold hover:bg-pink-50 transition-colors"
                    >
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gray-50">
          <SessionTrackingProvider>
            {children}
          </SessionTrackingProvider>
        </main>
        <InstallPWA />
      </body>
    </html>
  )
}
