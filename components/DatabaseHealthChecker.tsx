// components/DatabaseHealthChecker.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type HealthCheckResult = {
  table: string
  issue: string
  count: number
  details?: any[]
}

type ConnectionStatus = {
  connected: boolean
  responseTime: number
  error?: string
  timestamp: Date
}

type PerformanceMetrics = {
  avgQueryTime: number
  slowQueries: number
  totalQueries: number
  queries: { name: string; time: number }[]
}

type TableStatistics = {
  name: string
  rowCount: number
  lastChecked: Date
  error?: string
}

export default function DatabaseHealthChecker() {
  const [results, setResults] = useState<HealthCheckResult[]>([])
  const [loading, setLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [tableStats, setTableStats] = useState<TableStatistics[]>([])
  const [activeCheck, setActiveCheck] = useState<string>('')
  const supabase = createClient()

  const checkConnectionStatus = async () => {
    setActiveCheck('connection')
    const startTime = performance.now()

    try {
      // Test basic connection with a simple query
      const { data, error } = await supabase
        .from('services')
        .select('id')
        .limit(1)

      const endTime = performance.now()
      const responseTime = endTime - startTime

      if (error) {
        setConnectionStatus({
          connected: false,
          responseTime,
          error: error.message,
          timestamp: new Date()
        })
      } else {
        setConnectionStatus({
          connected: true,
          responseTime,
          timestamp: new Date()
        })
      }
    } catch (error) {
      setConnectionStatus({
        connected: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      })
    }

    setActiveCheck('')
  }

  const checkPerformanceMetrics = async () => {
    setActiveCheck('performance')
    const queries: { name: string; time: number }[] = []

    try {
      // Test multiple query types and measure their performance

      // Query 1: Simple count
      let start = performance.now()
      await supabase.from('appointments').select('id', { count: 'exact', head: true })
      queries.push({ name: 'Count appointments', time: performance.now() - start })

      // Query 2: Join query
      start = performance.now()
      await supabase
        .from('appointments')
        .select('id, service:services(name)')
        .limit(10)
      queries.push({ name: 'Join appointments-services', time: performance.now() - start })

      // Query 3: Filter query
      start = performance.now()
      await supabase
        .from('services')
        .select('*')
        .gte('price', 0)
        .limit(10)
      queries.push({ name: 'Filter services', time: performance.now() - start })

      // Query 4: Complex query with multiple joins
      start = performance.now()
      await supabase
        .from('appointments')
        .select(`
          id,
          service:services(name, category:service_categories(name)),
          user:profiles(email)
        `)
        .limit(5)
      queries.push({ name: 'Complex multi-join', time: performance.now() - start })

      const avgTime = queries.reduce((sum, q) => sum + q.time, 0) / queries.length
      const slowQueries = queries.filter(q => q.time > 500).length

      setPerformanceMetrics({
        avgQueryTime: avgTime,
        slowQueries,
        totalQueries: queries.length,
        queries
      })
    } catch (error) {
      console.error('Error checking performance:', error)
      setPerformanceMetrics({
        avgQueryTime: 0,
        slowQueries: 0,
        totalQueries: 0,
        queries: []
      })
    }

    setActiveCheck('')
  }

  const checkTableStatistics = async () => {
    setActiveCheck('tables')
    const tables = [
      'appointments',
      'services',
      'service_categories',
      'products',
      'product_categories',
      'appointment_products',
      'staff',
      'staff_categories',
      'staff_positions',
      'staff_specializations',
      'profiles',
      'time_slots',
      'notification_preferences'
    ]

    const stats: TableStatistics[] = []

    for (const tableName of tables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          stats.push({
            name: tableName,
            rowCount: 0,
            lastChecked: new Date(),
            error: error.message
          })
        } else {
          stats.push({
            name: tableName,
            rowCount: count || 0,
            lastChecked: new Date()
          })
        }
      } catch (error) {
        stats.push({
          name: tableName,
          rowCount: 0,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    setTableStats(stats)
    setActiveCheck('')
  }

  const runAllChecks = async () => {
    setLoading(true)
    await checkConnectionStatus()
    await checkPerformanceMetrics()
    await checkTableStatistics()
    await checkForeignKeyIntegrity()
    setLoading(false)
  }

  const checkForeignKeyIntegrity = async () => {
    setLoading(true)
    const issues: HealthCheckResult[] = []

    try {
      // Check 1: Orphaned appointments (invalid service_id)
      const { data: orphanedAppointments, error: e1 } = await supabase
        .from('appointments')
        .select(`
          id, service_id, customer_name,
          service:services(id)
        `)
      
      if (!e1) {
        const orphaned = orphanedAppointments?.filter(a => !a.service) || []
        if (orphaned.length > 0) {
          issues.push({
            table: 'appointments',
            issue: 'Invalid service_id references',
            count: orphaned.length,
            details: orphaned
          })
        }
      }

      // Check 2: Orphaned appointment_products
      const { data: orphanedProducts, error: e2 } = await supabase
        .from('appointment_products')
        .select(`
          id, appointment_id, product_id,
          appointment:appointments(id),
          product:products(id)
        `)
      
      if (!e2) {
        const orphaned = orphanedProducts?.filter(ap => !ap.appointment || !ap.product) || []
        if (orphaned.length > 0) {
          issues.push({
            table: 'appointment_products',
            issue: 'Invalid appointment_id or product_id references',
            count: orphaned.length,
            details: orphaned
          })
        }
      }

      // Check 3: Services with invalid category_id
      const { data: orphanedServices, error: e3 } = await supabase
        .from('services')
        .select(`
          id, name, category_id,
          category:service_categories(id)
        `)
      
      if (!e3) {
        const orphaned = orphanedServices?.filter(s => s.category_id && !s.category) || []
        if (orphaned.length > 0) {
          issues.push({
            table: 'services',
            issue: 'Invalid category_id references',
            count: orphaned.length,
            details: orphaned
          })
        }
      }

      // Check 4: Products with invalid category_id
      const { data: orphanedProductCats, error: e4 } = await supabase
        .from('products')
        .select(`
          id, name, category_id,
          category:product_categories(id)
        `)
      
      if (!e4) {
        const orphaned = orphanedProductCats?.filter(p => p.category_id && !p.category) || []
        if (orphaned.length > 0) {
          issues.push({
            table: 'products',
            issue: 'Invalid category_id references',
            count: orphaned.length,
            details: orphaned
          })
        }
      }

      // Check 5: Appointments with invalid user_id
      const { data: appointmentsWithUsers, error: e5 } = await supabase
        .from('appointments')
        .select(`
          id, user_id, customer_name,
          user:profiles(id)
        `)
        .not('user_id', 'is', null)
      
      if (!e5) {
        const orphaned = appointmentsWithUsers?.filter(a => a.user_id && !a.user) || []
        if (orphaned.length > 0) {
          issues.push({
            table: 'appointments',
            issue: 'Invalid user_id references',
            count: orphaned.length,
            details: orphaned
          })
        }
      }

      setResults(issues)
    } catch (error) {
      console.error('Error checking foreign key integrity:', error)
      setResults([{
        table: 'system',
        issue: 'Error running health check',
        count: 1,
        details: [{ error: error instanceof Error ? error.message : String(error) }]
      }])
    } finally {
      setLoading(false)
    }
  }

  const fixOrphanedRecords = async (table: string, issue: string) => {
    if (!confirm(`Are you sure you want to fix "${issue}" in ${table}? This may delete orphaned records.`)) {
      return
    }

    try {
      // Example fix for orphaned appointment_products
      if (table === 'appointment_products' && issue.includes('Invalid appointment_id')) {
        const { error } = await supabase
          .from('appointment_products')
          .delete()
          .not('appointment_id', 'in', 
            `(SELECT id FROM appointments)`
          )
        
        if (error) throw error
        alert('Orphaned appointment_products deleted')
      }
      
      // Refresh the check
      checkForeignKeyIntegrity()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      alert(`Error fixing issue: ${errorMessage}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Database Health Check</h2>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={runAllChecks}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Running All Checks...' : '🔍 Run All Checks'}
          </button>
          <button
            onClick={checkConnectionStatus}
            disabled={loading || activeCheck !== ''}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {activeCheck === 'connection' ? 'Checking...' : 'Connection Status'}
          </button>
          <button
            onClick={checkPerformanceMetrics}
            disabled={loading || activeCheck !== ''}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {activeCheck === 'performance' ? 'Checking...' : 'Performance Metrics'}
          </button>
          <button
            onClick={checkTableStatistics}
            disabled={loading || activeCheck !== ''}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {activeCheck === 'tables' ? 'Checking...' : 'Table Statistics'}
          </button>
          <button
            onClick={checkForeignKeyIntegrity}
            disabled={loading || activeCheck !== ''}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading && activeCheck === '' ? 'Checking...' : 'Foreign Key Integrity'}
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">🔌 Connection Status</h3>
          <div className={`p-4 rounded-lg ${connectionStatus.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">
                {connectionStatus.connected ? '✅ Connected' : '❌ Disconnected'}
              </span>
              <span className="text-sm text-gray-600">
                {connectionStatus.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <span className="text-sm text-gray-600">Response Time:</span>
                <span className={`ml-2 font-medium ${connectionStatus.responseTime < 100 ? 'text-green-600' : connectionStatus.responseTime < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {connectionStatus.responseTime.toFixed(2)}ms
                </span>
              </div>
              {connectionStatus.error && (
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">Error:</span>
                  <p className="text-red-600 text-sm mt-1">{connectionStatus.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">⚡ Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Average Query Time</div>
              <div className={`text-2xl font-bold ${performanceMetrics.avgQueryTime < 100 ? 'text-green-600' : performanceMetrics.avgQueryTime < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                {performanceMetrics.avgQueryTime.toFixed(2)}ms
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Total Queries</div>
              <div className="text-2xl font-bold text-purple-600">
                {performanceMetrics.totalQueries}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-gray-600 mb-1">Slow Queries (&gt;500ms)</div>
              <div className={`text-2xl font-bold ${performanceMetrics.slowQueries === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {performanceMetrics.slowQueries}
              </div>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              View Query Details
            </summary>
            <div className="mt-3 space-y-2">
              {performanceMetrics.queries.map((query, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm">{query.name}</span>
                  <span className={`text-sm font-medium ${query.time < 100 ? 'text-green-600' : query.time < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {query.time.toFixed(2)}ms
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Table Statistics */}
      {tableStats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">📊 Table Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Checked
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableStats.map((stat, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {stat.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {stat.error ? '-' : stat.rowCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {stat.error ? (
                        <span className="text-red-600" title={stat.error}>❌ Error</span>
                      ) : (
                        <span className="text-green-600">✅ OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {stat.lastChecked.toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900">
                    {tableStats.reduce((sum, stat) => sum + (stat.error ? 0 : stat.rowCount), 0).toLocaleString()}
                  </td>
                  <td colSpan={2} className="px-4 py-3 text-sm text-gray-500">
                    {tableStats.filter(s => !s.error).length} / {tableStats.length} tables accessible
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Foreign Key Integrity Results */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">🔗 Foreign Key Integrity</h3>

        {results.length === 0 && !loading && connectionStatus !== null && (
          <div className="text-green-600 font-medium p-4 bg-green-50 rounded-lg border border-green-200">
            ✅ No foreign key issues detected!
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border border-red-200 rounded p-4 bg-red-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-red-800">
                      {result.table}: {result.issue}
                    </h4>
                    <p className="text-red-600">
                      {result.count} issue(s) found
                    </p>
                  </div>
                  <button
                    onClick={() => fixOrphanedRecords(result.table, result.issue)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Fix Issues
                  </button>
                </div>

                {result.details && result.details.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-red-700">
                      Show Details ({result.details.length} records)
                    </summary>
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Utility function to check specific FK error from Supabase error
export function isForeignKeyError(error: any): boolean {
  if (!error) return false
  
  const message = error.message?.toLowerCase() || ''
  const code = error.code || ''
  
  return (
    message.includes('foreign key') ||
    message.includes('violates foreign key constraint') ||
    message.includes('fk_') ||
    code === '23503' // PostgreSQL foreign key violation error code
  )
}

// Utility to extract FK constraint info from error
export function parseForeignKeyError(error: any): {
  table?: string
  column?: string
  referencedTable?: string
  constraint?: string
} {
  const message = error.message || ''
  
  // Try to extract table and constraint info
  const constraintMatch = message.match(/constraint "([^"]+)"/i)
  const tableMatch = message.match(/on table "([^"]+)"/i)
  
  return {
    constraint: constraintMatch?.[1],
    table: tableMatch?.[1],
  }
}