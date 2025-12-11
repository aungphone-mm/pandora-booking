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
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '-10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-5%',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        borderRadius: '50%'
      }}></div>
      
      <div style={{ padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        {/* Enhanced Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '8px'
          }}>💅</div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            margin: '0',
            background: 'linear-gradient(135deg, #ec4899 0%, #f9a8d4 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Pandora Beauty
          </h2>
          <div style={{
            fontSize: '0.9rem',
            color: '#94a3b8',
            fontWeight: '500',
            marginTop: '4px'
          }}>
            Admin Control Panel
          </div>
        </div>

        {/* Navigation */}
        <nav>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '16px',
            paddingLeft: '16px'
          }}>
            Navigation
          </div>
          <ul style={{
            listStyle: 'none',
            padding: '0',
            margin: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {links.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={handleLinkClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    textDecoration: 'none',
                    color: 'inherit',
                    fontSize: '1rem',
                    fontWeight: '500',
                    position: 'relative',
                    border: pathname === link.href ? '1px solid rgba(236, 72, 153, 0.3)' : '1px solid transparent'
                  }}
                  className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
                >
                  <span 
                    style={{ 
                      fontSize: '1.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px'
                    }}
                    className="sidebar-icon"
                  >
                    {link.icon}
                  </span>
                  
                  <span style={{ flex: 1 }}>{link.label}</span>
                  
                  {link.badge && (
                    <span 
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.7rem',
                        borderRadius: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: link.badge === 'BI' 
                          ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' 
                          : link.badge === 'NEW'
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                      }}
                      className="sidebar-badge"
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
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(190, 24, 93, 0.1) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(236, 72, 153, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '8px'
          }}>✨</div>
          <div style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#f1f5f9',
            marginBottom: '4px'
          }}>
            Admin Dashboard
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: '#94a3b8'
          }}>
            Manage your salon efficiently
          </div>
        </div>

        {/* Quick Stats Mini Widget */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: '#94a3b8',
            marginBottom: '8px',
            textAlign: 'center'
          }}>
            Quick Status
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '0.75rem'
          }}>
            <div style={{ textAlign: 'center', color: '#10b981' }}>
              <div style={{ fontWeight: '700' }}>Online</div>
              <div style={{ color: '#94a3b8' }}>System</div>
            </div>
            <div style={{ textAlign: 'center', color: '#ec4899' }}>
              <div style={{ fontWeight: '700' }}>Active</div>
              <div style={{ color: '#94a3b8' }}>Admin</div>
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
        className="desktop-sidebar"
        style={{
          width: '280px',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          minHeight: '100vh',
          boxShadow: '8px 0 30px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
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
