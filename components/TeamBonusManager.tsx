'use client'

import { useState, useEffect } from 'react'

type TeamBonus = {
  id: string
  goal_description: string
  bonus_amount: number
  period_start: string
  period_end: string
  is_achieved: boolean
  distribution_method: 'equal' | 'proportional'
  created_at: string
}

export default function TeamBonusManager() {
  const [bonuses, setBonuses] = useState<TeamBonus[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    goal_description: '',
    bonus_amount: '',
    period_start: '',
    period_end: '',
    is_achieved: false,
    distribution_method: 'equal' as 'equal' | 'proportional'
  })

  useEffect(() => {
    fetchBonuses()
  }, [])

  const fetchBonuses = async () => {
    try {
      const res = await fetch('/api/team-bonuses')
      const data = await res.json()
      setBonuses(data.bonuses || [])
    } catch (error) {
      console.error('Error fetching bonuses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Update
        await fetch('/api/team-bonuses', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            ...formData,
            bonus_amount: parseFloat(formData.bonus_amount)
          })
        })
      } else {
        // Create
        await fetch('/api/team-bonuses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            bonus_amount: parseFloat(formData.bonus_amount)
          })
        })
      }

      // Reset form
      setFormData({
        goal_description: '',
        bonus_amount: '',
        period_start: '',
        period_end: '',
        is_achieved: false,
        distribution_method: 'equal'
      })
      setShowForm(false)
      setEditingId(null)
      fetchBonuses()
    } catch (error) {
      console.error('Error saving bonus:', error)
      alert('Failed to save team bonus')
    }
  }

  const handleEdit = (bonus: TeamBonus) => {
    setFormData({
      goal_description: bonus.goal_description,
      bonus_amount: bonus.bonus_amount.toString(),
      period_start: bonus.period_start,
      period_end: bonus.period_end,
      is_achieved: bonus.is_achieved,
      distribution_method: bonus.distribution_method
    })
    setEditingId(bonus.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team bonus?')) return

    try {
      await fetch(`/api/team-bonuses?id=${id}`, {
        method: 'DELETE'
      })
      fetchBonuses()
    } catch (error) {
      console.error('Error deleting bonus:', error)
      alert('Failed to delete team bonus')
    }
  }

  const toggleAchieved = async (bonus: TeamBonus) => {
    try {
      await fetch('/api/team-bonuses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: bonus.id,
          is_achieved: !bonus.is_achieved
        })
      })
      fetchBonuses()
    } catch (error) {
      console.error('Error updating bonus:', error)
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
          <h2 className="text-2xl font-bold text-gray-900">Team Bonuses</h2>
          <p className="text-gray-600 mt-1">Manage salon-wide team goals and bonuses</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              goal_description: '',
              bonus_amount: '',
              period_start: '',
              period_end: '',
              is_achieved: false,
              distribution_method: 'equal'
            })
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Team Bonus'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Team Bonus' : 'New Team Bonus'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Description
              </label>
              <input
                type="text"
                required
                value={formData.goal_description}
                onChange={(e) => setFormData({ ...formData, goal_description: e.target.value })}
                placeholder="e.g., Reach $50,000 monthly revenue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonus Amount ($)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.bonus_amount}
                  onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                  placeholder="1000.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distribution Method
                </label>
                <select
                  value={formData.distribution_method}
                  onChange={(e) => setFormData({ ...formData, distribution_method: e.target.value as 'equal' | 'proportional' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="equal">Equal Split</option>
                  <option value="proportional">Proportional (Not Yet Implemented)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period Start
                </label>
                <input
                  type="date"
                  required
                  value={formData.period_start}
                  onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period End
                </label>
                <input
                  type="date"
                  required
                  value={formData.period_end}
                  onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_achieved"
                checked={formData.is_achieved}
                onChange={(e) => setFormData({ ...formData, is_achieved: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_achieved" className="ml-2 text-sm font-medium text-gray-700">
                Mark as Achieved (bonus will be distributed)
              </label>
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
        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
          <div className="text-sm text-green-700">Achieved</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {bonuses.filter(b => b.is_achieved).length}
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow-md border border-blue-200">
          <div className="text-sm text-blue-700">Total Bonus Pool</div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            ${bonuses.filter(b => b.is_achieved).reduce((sum, b) => sum + b.bonus_amount, 0).toLocaleString()}
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
                  Goal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                    No team bonuses yet. Create one to get started!
                  </td>
                </tr>
              ) : (
                bonuses.map((bonus) => (
                  <tr key={bonus.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{bonus.goal_description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(bonus.period_start).toLocaleDateString()} - {new Date(bonus.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ${bonus.bonus_amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 capitalize">{bonus.distribution_method}</div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAchieved(bonus)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          bonus.is_achieved
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {bonus.is_achieved ? '✓ Achieved' : '⏱ Pending'}
                      </button>
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
        <h4 className="font-semibold text-blue-900 mb-2">💡 How Team Bonuses Work</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Set salon-wide goals (revenue targets, appointment counts, etc.)</li>
          <li>• When goal is achieved, mark the bonus as "Achieved"</li>
          <li>• Bonus is automatically distributed to all active staff during payroll calculation</li>
          <li>• <strong>Equal Split:</strong> Divides bonus equally among all staff</li>
          <li>• <strong>Proportional:</strong> Based on hours/revenue (coming soon)</li>
        </ul>
      </div>
    </div>
  )
}
