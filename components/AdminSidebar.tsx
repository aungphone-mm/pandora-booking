'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Explicitly define the component with no props
export default function AdminSidebar() {
  const pathname = usePathname()
  
  const links: Array<{ href: string; label: string; badge?: string }> = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/reports', label: '📊 Business Intelligence', badge: 'BI' },
    { href: '/admin/advanced-reports', label: '🚀 Advanced Analytics', badge: 'NEW' },
    { href: '/admin/appointments', label: 'Appointments' },
    { href: '/admin/staff', label: 'Staff Management' },
    { href: '/admin/services', label: 'Services' },
    { href: '/admin/service-categories', label: 'Service Categories' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/product-categories', label: 'Product Categories' },
    { href: '/admin/timeslots', label: 'Time Slots' },
    { href: '/admin/health-check', label: '🔍 Health Check', badge: 'DIAG' }, 
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
                  className={`block px-4 py-2 rounded hover:bg-gray-700 relative ${
                    pathname === link.href ? 'bg-gray-700' : ''
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      link.badge === 'BI' 
                        ? 'bg-purple-500 text-white' 
                        : link.badge === 'NEW'
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}