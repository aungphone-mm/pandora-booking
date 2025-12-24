import { requireAdmin } from '@/lib/auth-helpers'
import StaffReportGenerator from '@/components/StaffReportGenerator'

export default async function StaffReportPage() {
  await requireAdmin()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Comprehensive Staff Report
        </h1>
        <p className="text-gray-600">
          Generate detailed staff performance and payroll reports
        </p>
      </div>

      <StaffReportGenerator />
    </div>
  )
}
