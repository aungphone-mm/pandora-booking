'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Explicitly define the component with no props
export default function AdminSidebar() {
  const pathname = usePathname()
  
  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/appointments', label: 'Appointments' },
    { href: '/admin/services', label: 'Services' },
    { href: '/admin/service-categories', label: 'Service Categories' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/product-categories', label: 'Product Categories' },
    { href: '/admin/timeslots', label: 'Time Slots' },
  ]

  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
        <nav>
          <ul className="space-y-2">
            {links.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`block px-4 py-2 rounded hover:bg-gray-700 ${
                    pathname === link.href ? 'bg-gray-700' : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}