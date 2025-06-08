// app/admin/health-check/page.tsx
import DatabaseHealthChecker from '@/components/DatabaseHealthChecker'

export default function AdminHealthCheckPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Database Health Check</h1>
      <DatabaseHealthChecker />
    </div>
  )
}