'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type StaffEarnings = {
  id: string
  staff_id: string
  staff_name: string
  period_month: number
  period_year: number
  total_appointments: number
  total_revenue: number
  base_pay: number
  commission: number
  bonuses: number
  net_pay: number
  tier: string
}

export default function StaffEarningsTracker() {
  const supabase = createClient()
  const [earnings, setEarnings] = useState<StaffEarnings[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<Map<number, { basePay: number; commission: number; bonuses: number }> | null>(null)

  useEffect(() => {
    loadStaffList()
  }, [])

  useEffect(() => {
    loadEarnings()
  }, [selectedStaff, selectedYear])

  const loadStaffList = async () => {
    const { data } = await supabase
      .from('staff')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name')

    setStaffList(data || [])
  }

  const loadEarnings = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('monthly_payroll')
        .select(`
          *,
          staff(full_name),
          performance_tier:performance_tiers(name)
        `)
        .eq('period_year', selectedYear)
        .order('period_month', { ascending: false })

      if (selectedStaff !== 'all') {
        query = query.eq('staff_id', selectedStaff)
      }

      const { data, error } = await query

      if (error) throw error

      const mappedData = (data || []).map(record => ({
        id: record.id,
        staff_id: record.staff_id,
        staff_name: record.staff?.full_name || 'Unknown',
        period_month: record.period_month,
        period_year: record.period_year,
        total_appointments: record.completed_appointments,
        total_revenue: Number(record.total_service_revenue) + Number(record.total_product_sales),
        base_pay: Number(record.base_pay),
        commission: Number(record.adjusted_commission),
        bonuses: Number(record.total_bonuses),
        net_pay: Number(record.net_pay),
        tier: record.performance_tier?.name || 'N/A'
      }))

      setEarnings(mappedData)
      generateChartData(mappedData)
    } catch (err) {
      console.error('Error loading earnings:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = (data: StaffEarnings[]) => {
    // Group by month for chart
    const monthlyData = new Map<number, { basePay: number; commission: number; bonuses: number }>()

    for (const record of data) {
      const existing = monthlyData.get(record.period_month) || { basePay: 0, commission: 0, bonuses: 0 }
      monthlyData.set(record.period_month, {
        basePay: existing.basePay + record.base_pay,
        commission: existing.commission + record.commission,
        bonuses: existing.bonuses + record.bonuses
      })
    }

    setChartData(monthlyData)
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getTotalEarnings = () => {
    return earnings.reduce((sum, e) => sum + e.net_pay, 0)
  }

  const getTotalAppointments = () => {
    return earnings.reduce((sum, e) => sum + e.total_appointments, 0)
  }

  const getAverageEarnings = () => {
    return earnings.length > 0 ? getTotalEarnings() / earnings.length : 0
  }

  const exportToCSV = () => {
    const headers = ['Staff', 'Month', 'Year', 'Appointments', 'Revenue', 'Base Pay', 'Commission', 'Bonuses', 'Net Pay', 'Tier']
    const rows = earnings.map(e => [
      e.staff_name,
      months[e.period_month - 1],
      e.period_year,
      e.total_appointments,
      e.total_revenue.toFixed(2),
      e.base_pay.toFixed(2),
      e.commission.toFixed(2),
      e.bonuses.toFixed(2),
      e.net_pay.toFixed(2),
      e.tier
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `staff-earnings-${selectedYear}.csv`
    a.click()
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">📊 Staff Earnings Tracker</h1>
            <p className="text-gray-600 mt-1">Track individual staff performance and earnings</p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Staff:</label>
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="all">All Staff</option>
            {staffList.map(staff => (
              <option key={staff.id} value={staff.id}>{staff.full_name}</option>
            ))}
          </select>

          <label className="text-sm font-medium text-gray-700 ml-4">Year:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          <p className="mt-4 text-gray-600">Loading earnings data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Earnings</p>
                  <p className="text-3xl font-bold mt-1">${getTotalEarnings().toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-50">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Appointments</p>
                  <p className="text-3xl font-bold mt-1">{getTotalAppointments()}</p>
                </div>
                <div className="text-4xl opacity-50">📅</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Avg Earnings/Period</p>
                  <p className="text-3xl font-bold mt-1">${getAverageEarnings().toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-50">📊</div>
              </div>
            </div>
          </div>

          {/* Earnings Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-violet-600 to-purple-600">
              <h2 className="text-xl font-bold text-white">Earnings History</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bonuses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {earnings.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.staff_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {months[record.period_month - 1]} {record.period_year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.total_appointments}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${record.total_revenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${record.base_pay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        ${record.commission.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                        ${record.bonuses.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        ${record.net_pay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-800">
                          {record.tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {earnings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No earnings data found for the selected period.</p>
                </div>
              )}
            </div>
          </div>

          {/* Simple Bar Chart Visualization */}
          {chartData && chartData.size > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Monthly Earnings Breakdown</h2>
              <div className="space-y-4">
                {Array.from(chartData.entries())
                  .sort((a, b) => (a[0] as number) - (b[0] as number))
                  .map(([month, data]) => {
                    const total = data.basePay + data.commission + data.bonuses
                    const baseWidth = (data.basePay / total) * 100
                    const commissionWidth = (data.commission / total) * 100
                    const bonusWidth = (data.bonuses / total) * 100

                    return (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{months[month - 1]}</span>
                          <span className="text-sm font-bold text-gray-900">${total.toFixed(2)}</span>
                        </div>
                        <div className="flex h-8 rounded-lg overflow-hidden">
                          <div
                            className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${baseWidth}%` }}
                          >
                            {baseWidth > 10 && 'Base'}
                          </div>
                          <div
                            className="bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${commissionWidth}%` }}
                          >
                            {commissionWidth > 10 && 'Comm'}
                          </div>
                          <div
                            className="bg-purple-500 flex items-center justify-center text-xs text-white font-medium"
                            style={{ width: `${bonusWidth}%` }}
                          >
                            {bonusWidth > 10 && 'Bonus'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>

              <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Base Pay</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Commission</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Bonuses</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
