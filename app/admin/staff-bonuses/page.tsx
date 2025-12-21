import { requireAdmin } from '@/lib/auth-helpers'
import IndividualBonusManager from '@/components/IndividualBonusManager'

export default async function StaffBonusesPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <IndividualBonusManager />
    </div>
  )
}
