'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type PayrollRecord = {
  id: string
  staff: {
    full_name: string
    email: string
  }
  period_month: number
  period_year: number
  total_hours: number
  base_pay: number
  adjusted_commission: number
  total_bonuses: number
  gross_pay: number
  net_pay: number
  status: string
  performance_tier: {
    name: string
  } | null
}

type PayrollSummary = {
  totalStaff: number
  totalGrossPay: number
  totalNetPay: number
  totalCommissions: number
  totalBonuses: number
  totalHours: number
  payrolls: PayrollRecord[]
}

export default function PayrollDashboard() {
  const supabase = createClient()
  const [summary, setSummary] = useState<PayrollSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [error, setError] = useState<string | null>(null)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])
  const [newBonus, setNewBonus] = useState({
    staffId: '',
    bonusType: 'custom',
    amount: '',
    description: ''
  })

  useEffect(() => {
    loadPayrollSummary()
    loadStaffList()
  }, [selectedMonth, selectedYear])

  const loadPayrollSummary = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/payroll/summary?month=${selectedMonth}&year=${selectedYear}`
      )

      if (!response.ok) {
        throw new Error('Failed to load payroll summary')
      }

      const result = await response.json()
      setSummary(result.data)
    } catch (err: any) {
      setError(err.message)
      console.error('Error loading payroll:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStaffList = async () => {
    const { data } = await supabase
      .from('staff')
      .select('id, full_name')
      .eq('is_active', true)
      .order('full_name')

    setStaffList(data || [])
  }

  const calculatePayroll = async () => {
    if (!confirm('Calculate payroll for all active staff? This will recalculate existing records.')) {
      return
    }

    try {
      setCalculating(true)
      setError(null)

      const response = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate payroll')
      }

      await loadPayrollSummary()
      alert('Payroll calculated successfully!')
    } catch (err: any) {
      setError(err.message)
      console.error('Error calculating payroll:', err)
    } finally {
      setCalculating(false)
    }
  }

  const approvePayroll = async (payrollId: string) => {
    if (!confirm('Approve this payroll record?')) return

    try {
      const response = await fetch('/api/payroll/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollId })
      })

      if (!response.ok) throw new Error('Failed to approve payroll')

      await loadPayrollSummary()
      alert('Payroll approved!')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const markAsPaid = async (payrollId: string) => {
    if (!confirm('Mark this payroll as paid?')) return

    try {
      const response = await fetch('/api/payroll/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payrollId })
      })

      if (!response.ok) throw new Error('Failed to mark as paid')

      await loadPayrollSummary()
      alert('Payroll marked as paid!')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const addBonus = async () => {
    if (!newBonus.staffId || !newBonus.amount || !newBonus.description) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/payroll/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: newBonus.staffId,
          bonusType: newBonus.bonusType,
          amount: parseFloat(newBonus.amount),
          description: newBonus.description,
          periodMonth: selectedMonth,
          periodYear: selectedYear
        })
      })

      if (!response.ok) throw new Error('Failed to add bonus')

      setShowBonusModal(false)
      setNewBonus({ staffId: '', bonusType: 'custom', amount: '', description: '' })
      alert('Bonus added successfully!')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      calculated: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-purple-100 text-purple-800'
    }
    return styles[status as keyof typeof styles] || styles.draft
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">💰 Payroll Management</h1>
            <p className="text-gray-600 mt-1">Manage staff payroll, commissions, and bonuses</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowBonusModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Add Bonus
            </button>
            <button
              onClick={calculatePayroll}
              disabled={calculating}
              className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {calculating ? '⏳ Calculating...' : '🔄 Calculate Payroll'}
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            {months.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
          <p className="mt-4 text-gray-600">Loading payroll data...</p>
        </div>
      ) : summary ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Staff</p>
                  <p className="text-3xl font-bold mt-1">{summary.totalStaff}</p>
                </div>
                <div className="text-4xl opacity-50">👥</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Net Pay</p>
                  <p className="text-3xl font-bold mt-1">${summary.totalNetPay.toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-50">💵</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Commissions</p>
                  <p className="text-3xl font-bold mt-1">${summary.totalCommissions.toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-50">💎</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Total Bonuses</p>
                  <p className="text-3xl font-bold mt-1">${summary.totalBonuses.toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-50">🎁</div>
              </div>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-violet-600 to-purple-600">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Staff</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Base Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Bonuses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Net Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.payrolls.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.staff.full_name}</div>
                        <div className="text-sm text-gray-500">{record.staff.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-800">
                          {record.performance_tier?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(record.total_hours).toFixed(1)}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(record.base_pay).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(record.adjusted_commission).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${Number(record.total_bonuses).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${Number(record.net_pay).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {record.status === 'calculated' && (
                          <button
                            onClick={() => approvePayroll(record.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {record.status === 'approved' && (
                          <button
                            onClick={() => markAsPaid(record.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            💳 Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <p className="text-gray-500 text-lg">No payroll data for this period. Click "Calculate Payroll" to generate.</p>
        </div>
      )}

      {/* Add Bonus Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Custom Bonus</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
                <select
                  value={newBonus.staffId}
                  onChange={(e) => setNewBonus({ ...newBonus, staffId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Select staff...</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Type</label>
                <select
                  value={newBonus.bonusType}
                  onChange={(e) => setNewBonus({ ...newBonus, bonusType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  <option value="custom">Custom</option>
                  <option value="milestone">Milestone</option>
                  <option value="holiday">Holiday</option>
                  <option value="quality">Quality</option>
                  <option value="speed">Speed</option>
                  <option value="referral">Referral</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBonus.amount}
                  onChange={(e) => setNewBonus({ ...newBonus, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  placeholder="100.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newBonus.description}
                  onChange={(e) => setNewBonus({ ...newBonus, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                  rows={3}
                  placeholder="Bonus for exceptional customer service..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={addBonus}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700"
              >
                Add Bonus
              </button>
              <button
                onClick={() => setShowBonusModal(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
