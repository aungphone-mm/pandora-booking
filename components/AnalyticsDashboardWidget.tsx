'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardSummary {
  todaysRevenue: number
  todaysAppointments: number
  pendingAppointments: number
  utilizationRate: number
}

export function AnalyticsDashboardWidget() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSummary()
    // Refresh every 5 minutes
    const interval = setInterval(fetchSummary, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchSummary = async () => {
    try {
      setError(null)
      const response = await fetch('/api/analytics/summary')
      if (!response.ok) {
        throw new Error('Failed to fetch summary')
      }
      const data = await response.json()
      setSummary(data)
    } catch (err) {
      console.error('Summary fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' Ks'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Today's Analytics</h3>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Unavailable</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSummary}
            className="text-sm bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">Today's Performance</h3>
        <div className="flex space-x-2">
          <Link
            href="/admin/reports"
            className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded-md transition-colors"
          >
            📊 Reports
          </Link>
          <Link
            href="/admin/advanced-reports"
            className="text-sm bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 rounded-md transition-colors"
          >
            🚀 Advanced
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Today's Revenue</p>
              <p className="text-xl font-bold text-green-900">{formatCurrency(summary.todaysRevenue)}</p>
            </div>
            <div className="text-green-500 text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Appointments</p>
              <p className="text-xl font-bold text-blue-900">{summary.todaysAppointments}</p>
            </div>
            <div className="text-blue-500 text-2xl">📅</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700">Pending</p>
              <p className="text-xl font-bold text-orange-900">{summary.pendingAppointments}</p>
            </div>
            <div className="text-orange-500 text-2xl">⏳</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Utilization</p>
              <p className="text-xl font-bold text-purple-900">{Math.round(summary.utilizationRate)}%</p>
            </div>
            <div className="text-purple-500 text-2xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Insights</h4>
        <div className="space-y-2">
          {summary.utilizationRate < 50 && (
            <div className="text-xs bg-yellow-50 text-yellow-800 px-2 py-1 rounded border border-yellow-200">
              💡 Low utilization today - consider promotional offers
            </div>
          )}
          {summary.pendingAppointments > 5 && (
            <div className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200">
              📞 {summary.pendingAppointments} appointments need confirmation
            </div>
          )}
          {summary.todaysRevenue > 10000 && (
            <div className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded border border-green-200">
              🎉 Great revenue day! Above average performance
            </div>
          )}
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {new Date().toLocaleTimeString()} • Auto-refresh every 5 minutes
      </div>
    </div>
  )
}

export function ExportButton({ 
  startDate, 
  endDate, 
  format = 'csv' 
}: { 
  startDate: string
  endDate: string
  format?: 'csv' | 'json' 
}) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    try {
      setExporting(true)
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        format
      })
      
      const response = await fetch(`/api/analytics/export?${params}`)
      if (!response.ok) {
        throw new Error('Export failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pandora-analytics-${startDate}-to-${endDate}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
        exporting 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700'
      }`}
    >
      {exporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Exporting...
        </>
      ) : (
        <>
          <span className="mr-2">📊</span>
          Export {format.toUpperCase()}
        </>
      )}
    </button>
  )
}