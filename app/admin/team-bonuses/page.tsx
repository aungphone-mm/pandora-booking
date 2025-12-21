import { requireAdmin } from '@/lib/auth-helpers'
import TeamBonusManager from '@/components/TeamBonusManager'

export default async function TeamBonusesPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <TeamBonusManager />
    </div>
  )
}
