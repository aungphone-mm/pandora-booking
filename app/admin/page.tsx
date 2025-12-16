import AdminDashboard from '@/components/AdminDashboard'

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6 md:p-4 sm:p-3">
      {/* Enhanced Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-5xl md:text-4xl sm:text-3xl font-extrabold mb-2 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-xl md:text-base sm:text-sm text-slate-500 font-medium sm:px-2">
          Comprehensive business management for Pandora Beauty Salon
        </p>
      </div>

      {/* Dashboard Component */}
      <AdminDashboard />
    </div>
  )
}