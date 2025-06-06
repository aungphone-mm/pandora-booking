import AdminSidebar from '@/components/AdminSidebar'
import { ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  )
}