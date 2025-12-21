import { requireAdmin } from '@/lib/auth-helpers'
import PayrollSettingsManager from '@/components/PayrollSettingsManager'

export default async function PayrollSettingsPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <PayrollSettingsManager />
    </div>
  )
}
