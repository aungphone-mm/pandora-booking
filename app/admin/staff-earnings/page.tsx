import { requireAdmin } from '@/lib/auth-helpers'
import StaffEarningsTracker from '@/components/StaffEarningsTracker'

export default async function StaffEarningsPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 p-6">
      <StaffEarningsTracker />
    </div>
  )
}
