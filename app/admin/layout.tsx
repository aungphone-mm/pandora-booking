'use client'

import AdminSidebar from '@/components/AdminSidebar'
import { ReactNode } from 'react'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        <AdminSidebar />
        <div style={{
          flex: 1,
          padding: '0',
          overflow: 'auto',
          position: 'relative',
          minWidth: 0, // Prevents flex item from overflowing
        }}
        className="main-content"
        >
          {/* Main Content Area with Enhanced Styling */}
          <main style={{
            width: '100%',
            minHeight: '100vh',
            position: 'relative'
          }}>
            {/* Decorative background elements */}
            <div style={{
              position: 'absolute',
              top: '10%',
              right: '5%',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(236, 72, 153, 0.05) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: '20%',
              left: '10%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }}></div>
            
            {/* Content Container */}
            <div style={{
              position: 'relative',
              zIndex: 1
            }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile-specific styles using regular style tag */}
      <style>{`
        @media (max-width: 768px) {
          .main-content {
            padding-top: 70px !important;
            width: 100% !important;
          }
        }
        
        @media (min-width: 769px) {
          .main-content {
            padding-top: 0 !important;
          }
        }
      `}</style>
    </>
  )
}