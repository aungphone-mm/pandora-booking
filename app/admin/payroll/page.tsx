import { requireAdmin } from '@/lib/auth-helpers'
import PayrollDashboard from '@/components/PayrollDashboard'

export default async function AdminPayrollPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <PayrollDashboard />
    </div>
  )
}
