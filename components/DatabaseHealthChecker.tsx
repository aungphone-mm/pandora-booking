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

export default function DatabaseHealthChecker() {
  const [results, setResults] = useState<HealthCheckResult[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

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
        details: [{ error: error.message }]
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
      alert(`Error fixing issue: ${error.message}`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Database Health Check</h2>
      
      <div className="mb-4">
        <button
          onClick={checkForeignKeyIntegrity}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Foreign Key Integrity'}
        </button>
      </div>

      {results.length === 0 && !loading && (
        <div className="text-green-600 font-medium">
          ✅ No foreign key issues detected!
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="border border-red-200 rounded p-4 bg-red-50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-red-800">
                    {result.table}: {result.issue}
                  </h3>
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