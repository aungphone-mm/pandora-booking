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
        <header className="bg-pink-600 text-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold">Pandora Beauty Salon</Link>
              <nav className="flex gap-4 items-center">
                <Link href="/booking" className="hover:text-pink-200">Book Now</Link>
                {user ? (
                  <>
                    <Link href="/account" className="hover:text-pink-200">My Account</Link>
                    {profile?.is_admin && (
                      <Link href="/admin" className="hover:text-pink-200">Admin</Link>
                    )}
                    <form action="/api/auth/signout" method="POST">
                      <button className="hover:text-pink-200">Sign Out</button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="hover:text-pink-200">Login</Link>
                    <Link href="/auth/register" className="bg-white text-pink-600 px-4 py-2 rounded hover:bg-pink-50">
                      Register
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  )
}
