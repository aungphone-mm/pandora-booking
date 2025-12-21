import { requireAdmin } from '@/lib/auth-helpers'
import PerformanceTierManager from '@/components/PerformanceTierManager'

export default async function PerformanceTiersPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <PerformanceTierManager />
    </div>
  )
}
