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
      <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 font-sans">
        <AdminSidebar />
        <div className="flex-1 p-0 overflow-auto relative min-w-0 main-content">
          {/* Main Content Area with Enhanced Styling */}
          <main className="w-full min-h-screen relative">
            {/* Decorative background elements */}
            <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[20%] left-[10%] w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

            {/* Content Container */}
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile-specific styles */}
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
