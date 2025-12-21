'use client'

import { useState, useEffect } from 'react'

type PerformanceTier = {
  id: string
  name: string
  min_appointments: number
  max_appointments: number | null
  commission_multiplier: number
  monthly_bonus: number
  is_active: boolean
  created_at: string
}

export default function PerformanceTierManager() {
  const [tiers, setTiers] = useState<PerformanceTier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    min_appointments: '',
    max_appointments: '',
    commission_multiplier: '',
    monthly_bonus: '',
    is_active: true
  })

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/performance-tiers')
      const data = await res.json()
      setTiers(data.tiers || [])
    } catch (error) {
      console.error('Error fetching tiers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        name: formData.name,
        min_appointments: parseInt(formData.min_appointments),
        max_appointments: formData.max_appointments ? parseInt(formData.max_appointments) : null,
        commission_multiplier: parseFloat(formData.commission_multiplier),
        monthly_bonus: parseFloat(formData.monthly_bonus),
        is_active: formData.is_active
      }

      if (editingId) {
        // Update
        await fetch('/api/performance-tiers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            ...payload
          })
        })
      } else {
        // Create
        await fetch('/api/performance-tiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      // Reset form
      setFormData({
        name: '',
        min_appointments: '',
        max_appointments: '',
        commission_multiplier: '',
        monthly_bonus: '',
        is_active: true
      })
      setShowForm(false)
      setEditingId(null)
      fetchTiers()
    } catch (error) {
      console.error('Error saving tier:', error)
      alert('Failed to save performance tier')
    }
  }

  const handleEdit = (tier: PerformanceTier) => {
    setFormData({
      name: tier.name,
      min_appointments: tier.min_appointments.toString(),
      max_appointments: tier.max_appointments?.toString() || '',
      commission_multiplier: tier.commission_multiplier.toString(),
      monthly_bonus: tier.monthly_bonus.toString(),
      is_active: tier.is_active
    })
    setEditingId(tier.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this performance tier? This may affect payroll calculations.')) return

    try {
      await fetch(`/api/performance-tiers?id=${id}`, {
        method: 'DELETE'
      })
      fetchTiers()
    } catch (error) {
      console.error('Error deleting tier:', error)
      alert('Failed to delete performance tier')
    }
  }

  const toggleActive = async (tier: PerformanceTier) => {
    try {
      await fetch('/api/performance-tiers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: tier.id,
          is_active: !tier.is_active
        })
      })
      fetchTiers()
    } catch (error) {
      console.error('Error updating tier:', error)
    }
  }

  const getTierColor = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bronze': return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  const getTierIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'bronze': return '🥉'
      case 'silver': return '🥈'
      case 'gold': return '🥇'
      case 'platinum': return '💎'
      default: return '🏆'
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
          <h2 className="text-2xl font-bold text-gray-900">Performance Tiers</h2>
          <p className="text-gray-600 mt-1">Manage commission multipliers and bonuses based on appointment volume</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setFormData({
              name: '',
              min_appointments: '',
              max_appointments: '',
              commission_multiplier: '',
              monthly_bonus: '',
              is_active: true
            })
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Tier'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Performance Tier' : 'New Performance Tier'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bronze, Silver, Gold, Platinum"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Appointments
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.min_appointments}
                  onChange={(e) => setFormData({ ...formData, min_appointments: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Appointments (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.max_appointments}
                  onChange={(e) => setFormData({ ...formData, max_appointments: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Multiplier
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.commission_multiplier}
                  onChange={(e) => setFormData({ ...formData, commission_multiplier: e.target.value })}
                  placeholder="1.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">e.g., 1.15 = 115% of base commission</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Bonus ($)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.monthly_bonus}
                  onChange={(e) => setFormData({ ...formData, monthly_bonus: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                Active (tier is used in payroll calculations)
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
                {editingId ? 'Update' : 'Create'} Tier
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="text-sm text-gray-600">Total Tiers</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{tiers.length}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow-md border border-green-200">
          <div className="text-sm text-green-700">Active Tiers</div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {tiers.filter(t => t.is_active).length}
          </div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow-md border border-purple-200">
          <div className="text-sm text-purple-700">Highest Multiplier</div>
          <div className="text-3xl font-bold text-purple-900 mt-2">
            {tiers.length > 0 ? Math.max(...tiers.map(t => t.commission_multiplier)).toFixed(2) + 'x' : 'N/A'}
          </div>
        </div>
      </div>

      {/* Tiers Display - Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg shadow-md border border-gray-200 text-center text-gray-500">
            No performance tiers yet. Create one to start rewarding high-performing staff!
          </div>
        ) : (
          tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-white rounded-lg shadow-lg border-2 overflow-hidden ${
                tier.is_active ? 'border-blue-300' : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Tier Header */}
              <div className={`p-4 border-b-2 ${getTierColor(tier.name)}`}>
                <div className="text-center">
                  <div className="text-4xl mb-2">{getTierIcon(tier.name)}</div>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                </div>
              </div>

              {/* Tier Details */}
              <div className="p-4 space-y-3">
                <div className="text-center border-b pb-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {tier.min_appointments}
                    {tier.max_appointments ? ` - ${tier.max_appointments}` : '+'}
                  </div>
                  <div className="text-xs text-gray-600 uppercase">Appointments/Month</div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Multiplier</span>
                    <span className="text-lg font-bold text-blue-600">
                      {tier.commission_multiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bonus</span>
                    <span className="text-lg font-bold text-green-600">
                      ${tier.monthly_bonus.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <button
                    onClick={() => toggleActive(tier)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-medium mb-2 ${
                      tier.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {tier.is_active ? '✓ Active' : '✗ Inactive'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(tier)}
                      className="flex-1 text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tier.id)}
                      className="flex-1 text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 How Performance Tiers Work</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Staff are automatically assigned tiers based on completed appointments each month</li>
          <li>• <strong>Commission Multiplier:</strong> Applied to base commission (e.g., 1.15x = 15% increase)</li>
          <li>• <strong>Monthly Bonus:</strong> Fixed amount added to payroll when tier is achieved</li>
          <li>• Only active tiers are used in payroll calculations</li>
          <li>• Staff can move up tiers as they complete more appointments</li>
        </ul>
      </div>
    </div>
  )
}
