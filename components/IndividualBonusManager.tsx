'use client'

import { useState, useEffect } from 'react'

type StaffBonus = {
  id: string
  staff_id: string
  period_month: number
  period_year: number
  bonus_type: string
  amount: number
  reason: string
  created_at: string
  staff?: {
    id: string
    full_name: string
    email: string
  }
}

type Staff = {
  id: string
  full_name: string
  email: string
}

export default function IndividualBonusManager() {
  const [bonuses, setBonuses] = useState<StaffBonus[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const [formData, setFormData] = useState({
    staff_id: '',
    period_month: currentMonth.toString(),
    period_year: currentYear.toString(),
    bonus_type: 'performance',
    amount: '',
    reason: ''
  })

  useEffect(() => {
    fetchBonuses()
    fetchStaff()
  }, [])

  const fetchBonuses = async () => {
    try {
      const res = await fetch('/api/staff-bonuses')
      const data = await res.json()
      setBonuses(data.bonuses || [])
    } catch (error) {
      console.error('Error fetching bonuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      setStaff(data.staff || [])
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Update
        await fetch('/api/staff-bonuses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            ...formData,
            period_month: parseInt(formData.period_month),
            period_year: parseInt(formData.period_year),
            amount: parseFloat(formData.amount)
          })
        })
      } else {
        // Create
        await fetch('/api/staff-bonuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            period_month: parseInt(formData.period_month),
            period_year: parseInt(formData.period_year),
            amount: parseFloat(formData.amount)
          })
        })
      }

      // Reset form
      setFormData({
        staff_id: '',
        period_month: currentMonth.toString(),
        period_year: currentYear.toString(),
        bonus_type: 'performance',
        amount: '',
        reason: ''
      })
      setShowForm(false)
      setEditingId(null)
      fetchBonuses()
    } catch (error) {
      console.error('Error saving bonus:', error)
      alert('Failed to save bonus')
    }
  }

  const handleEdit = (bonus: StaffBonus) => {
    setFormData({
      staff_id: bonus.staff_id,
      period_month: bonus.period_month.toString(),
      period_year: bonus.period_year.toString(),
      bonus_type: bonus.bonus_type,
      amount: bonus.amount.toString(),
      reason: bonus.reason
    })
    setEditingId(bonus.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bonus?')) return

    try {
      await fetch(`/api/staff-bonuses?id=${id}`, {
        method: 'DELETE'
      })
      fetchBonuses()
    } catch (error) {
      console.error('Error deleting bonus:', error)
      alert('Failed to delete bonus')
    }
  }

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return months[month - 1]
  }

  const getBonusTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'bg-blue-100 text-blue-800'
      case 'attendance': return 'bg-green-100 text-green-800'
      case 'customer_service': return 'bg-purple-100 text-purple-800'
      case 'sales': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Individual Bonuses</h2>
          <p className="text-gray-600 mt-1">Assign custom bonuses to staff members</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              staff_id: '',
              period_month: currentMonth.toString(),
              period_year: currentYear.toString(),
              bonus_type: 'performance',
              amount: '',
              reason: ''
            })
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Bonus'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Bonus' : 'New Bonus'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Staff Member
              </label>
              <select
                required
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select staff member...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Month
                </label>
                <select
                  required
                  value={formData.period_month}
                  onChange={(e) => setFormData({ ...formData, period_month: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {getMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Year
                </label>
                <select
                  required
                  value={formData.period_year}
                  onChange={(e) => setFormData({ ...formData, period_year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonus Type
                </label>
                <select
                  value={formData.bonus_type}
                  onChange={(e) => setFormData({ ...formData, bonus_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="performance">Performance</option>
                  <option value="attendance">Attendance</option>
                  <option value="customer_service">Customer Service</option>
                  <option value="sales">Sales</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Exceptional customer feedback"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Create'} Bonus
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="text-sm text-gray-600">Total Bonuses</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{bonuses.length}</div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
          <div className="text-sm text-blue-700">This Month</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {bonuses.filter(b => b.period_month === currentMonth && b.period_year === currentYear).length}
          </div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
          <div className="text-sm text-green-700">Total Amount</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            ${bonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Bonuses List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bonuses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No individual bonuses yet. Create one to reward staff performance!
                  </td>
                </tr>
              ) : (
                bonuses.map((bonus) => (
                  <tr key={bonus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {bonus.staff?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{bonus.staff?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getMonthName(bonus.period_month)} {bonus.period_year}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${getBonusTypeColor(bonus.bonus_type)}`}>
                        {bonus.bonus_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ${bonus.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={bonus.reason}>
                        {bonus.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(bonus)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(bonus.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 How Individual Bonuses Work</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Assign custom bonuses to individual staff for specific periods</li>
          <li>• Choose bonus type: Performance, Attendance, Customer Service, Sales, or Other</li>
          <li>• Bonuses are automatically included in monthly payroll calculations</li>
          <li>• All bonuses for a period are summed and added to staff's gross pay</li>
        </ul>
      </div>
    </div>
  )
}
