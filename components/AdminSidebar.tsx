'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Explicitly define the component with no props
export default function AdminSidebar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const links: Array<{ href: string; label: string; badge?: string; icon: string }> = [
    { href: '/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/reports', label: 'Business Intelligence', badge: 'BI', icon: '📊' },
    { href: '/admin/advanced-reports', label: 'Advanced Analytics', badge: 'NEW', icon: '🚀' },
    { href: '/admin/appointments', label: 'Appointments', icon: '📅' },
    { href: '/admin/staff', label: 'Staff Management', icon: '👥' },
    { href: '/admin/services', label: 'Services', icon: '✨' },
    { href: '/admin/service-categories', label: 'Service Categories', icon: '📂' },
    { href: '/admin/products', label: 'Products', icon: '🛍️' },
    { href: '/admin/product-categories', label: 'Product Categories', icon: '📦' },
    { href: '/admin/timeslots', label: 'Time Slots', icon: '🕐' },
    { href: '/admin/gallery', label: 'Photo Gallery', icon: '🖼️' },
    { href: '/admin/health-check', label: 'Health Check', badge: 'DIAG', icon: '🔍' },
  ]

  useEffect(() => {
    // Add enhanced CSS for sidebar
    const style = document.createElement('style')
    style.textContent = `
      .sidebar-link {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }
      .sidebar-link::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.5s;
      }
      .sidebar-link:hover::before {
        left: 100%;
      }
      .sidebar-link:hover {
        transform: translateX(8px);
        background: linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(190, 24, 93, 0.2) 100%);
        box-shadow: 0 8px 25px rgba(236, 72, 153, 0.2);
        border-left: 4px solid #ec4899;
      }
      .sidebar-link.active {
        background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
        box-shadow: 0 8px 25px rgba(236, 72, 153, 0.4);
        transform: translateX(8px);
        border-left: 4px solid #f9a8d4;
      }
      .sidebar-badge {
        transition: all 0.2s ease-in-out;
      }
      .sidebar-link:hover .sidebar-badge {
        transform: scale(1.1);
      }
      .sidebar-icon {
        transition: all 0.2s ease-in-out;
      }
      .sidebar-link:hover .sidebar-icon {
        transform: scale(1.2);
      }
      .salon-logo {
        background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }

      /* Mobile responsiveness */
      .mobile-menu-btn {
        display: none;
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 1000;
        background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
        border: none;
        border-radius: 12px;
        padding: 12px;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
      }

      .desktop-sidebar {
        display: block;
      }

      .mobile-sidebar {
        display: none;
      }

      @media (max-width: 768px) {
        .mobile-menu-btn {
          display: block !important;
        }

        .desktop-sidebar {
          display: none !important;
        }

        .mobile-sidebar {
          display: block !important;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 999;
          width: 280px;
          height: 100vh;
          transform: translateX(-100%);
          transition: transform 0.3s ease-in-out;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          color: white;
          box-shadow: 8px 0 30px rgba(0, 0, 0, 0.2);
          overflow: auto;
        }

        .mobile-sidebar.open {
          transform: translateX(0);
        }

        .sidebar-link:hover {
          transform: none;
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 998;
          display: block;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // Close mobile menu when clicking on a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  const sidebarContent = (
    <>
      {/* Decorative background elements */}
      <div className="absolute top-[20%] -right-[10%] w-[200px] h-[200px] bg-[radial-gradient(circle,_rgba(236,72,153,0.1)_0%,_transparent_70%)] rounded-full"></div>
      <div className="absolute bottom-[10%] -left-[5%] w-[150px] h-[150px] bg-[radial-gradient(circle,_rgba(59,130,246,0.1)_0%,_transparent_70%)] rounded-full"></div>

      <div className="p-8 px-6 relative z-10">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-6 mb-8 border border-white/10 backdrop-blur-sm text-center">
          <div className="text-3xl mb-2">💅</div>
          <h2 className="text-2xl font-extrabold m-0 bg-gradient-to-r from-pink-500 to-pink-300 bg-clip-text text-transparent">
            Pandora Beauty
          </h2>
          <div className="text-sm text-slate-400 font-medium mt-1">
            Admin Control Panel
          </div>
        </div>

        {/* Navigation */}
        <nav>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4 pl-4">
            Navigation
          </div>
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {links.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={handleLinkClick}
                  className={`sidebar-link flex items-center gap-4 py-4 px-5 rounded-2xl no-underline text-inherit text-base font-medium relative ${
                    pathname === link.href
                      ? 'active border border-pink-500/30'
                      : 'border border-transparent'
                  }`}
                >
                  <span className="sidebar-icon text-xl flex items-center justify-center w-6 h-6">
                    {link.icon}
                  </span>

                  <span className="flex-1">{link.label}</span>

                  {link.badge && (
                    <span
                      className={`sidebar-badge px-2.5 py-1 text-xs rounded-xl font-bold uppercase tracking-wide text-white shadow-lg ${
                        link.badge === 'BI'
                          ? 'bg-gradient-to-r from-purple-500 to-purple-700'
                          : link.badge === 'NEW'
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-700'
                          : 'bg-gradient-to-r from-blue-500 to-blue-800'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Enhanced Footer Section */}
        <div className="mt-10 p-5 bg-gradient-to-br from-pink-500/10 to-pink-800/10 rounded-2xl border border-pink-500/20 text-center">
          <div className="text-2xl mb-2">✨</div>
          <div className="text-sm font-semibold text-slate-100 mb-1">
            Admin Dashboard
          </div>
          <div className="text-xs text-slate-400">
            Manage your salon efficiently
          </div>
        </div>

        {/* Quick Stats Mini Widget */}
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-blue-800/10 rounded-2xl border border-blue-500/20">
          <div className="text-xs text-slate-400 mb-2 text-center">
            Quick Status
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center text-emerald-500">
              <div className="font-bold">Online</div>
              <div className="text-slate-400">System</div>
            </div>
            <div className="text-center text-pink-500">
              <div className="font-bold">Active</div>
              <div className="text-slate-400">Admin</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="mobile-menu-btn"
      >
        {isMobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className="desktop-sidebar w-[280px] bg-gradient-to-b from-slate-800 to-slate-950 text-white min-h-screen shadow-2xl relative overflow-hidden"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}
      >
        {sidebarContent}
      </aside>

      {/* No need for style jsx since we're using the style tag in useEffect */}
    </>
  )
}
