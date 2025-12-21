'use client'

import { useState, useEffect } from 'react'

type PayrollSetting = {
  id: string
  setting_key: string
  setting_value: number
  description: string
  updated_at: string
  updated_by: string | null
}

export default function PayrollSettingsManager() {
  const [settings, setSettings] = useState<PayrollSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/payroll-settings')
      const data = await res.json()
      setSettings(data.settings || [])
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (settingKey: string, value: number) => {
    setSaving(settingKey)
    try {
      await fetch('/api/payroll-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setting_key: settingKey,
          setting_value: value
        })
      })
      fetchSettings()
    } catch (error) {
      console.error('Error updating setting:', error)
      alert('Failed to update setting')
    } finally {
      setSaving(null)
    }
  }

  const getSettingConfig = (key: string) => {
    const configs: Record<string, { label: string; unit: string; icon: string; color: string; info: string }> = {
      'product_commission_rate': {
        label: 'Product Commission Rate',
        unit: '%',
        icon: '🛍️',
        color: 'bg-purple-50 border-purple-200',
        info: 'Commission percentage applied to product sales'
      },
      'buffer_time_minutes': {
        label: 'Buffer Time per Appointment',
        unit: 'min',
        icon: '⏱️',
        color: 'bg-blue-50 border-blue-200',
        info: 'Extra time added to each appointment for setup/cleanup when calculating hours'
      },
      'retention_bonus_per_repeat': {
        label: 'Bonus per Repeat Customer',
        unit: '$',
        icon: '🔄',
        color: 'bg-green-50 border-green-200',
        info: 'Bonus amount awarded for each customer who books 2+ appointments in the month'
      },
      'retention_bonus_threshold': {
        label: 'Repeat Customer Threshold',
        unit: 'customers',
        icon: '🎯',
        color: 'bg-orange-50 border-orange-200',
        info: 'Number of repeat customers needed to unlock the extra retention bonus'
      },
      'retention_bonus_extra': {
        label: 'Extra Retention Bonus',
        unit: '$',
        icon: '🎁',
        color: 'bg-pink-50 border-pink-200',
        info: 'Additional bonus when retention threshold is met or exceeded'
      }
    }
    return configs[key] || { label: key, unit: '', icon: '⚙️', color: 'bg-gray-50 border-gray-200', info: '' }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payroll Settings</h2>
        <p className="text-gray-600 mt-1">Configure calculation parameters for payroll system</p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> Changes to these settings will affect all future payroll calculations.
              Previously calculated payroll records will not be affected.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => {
          const config = getSettingConfig(setting.setting_key)
          return (
            <SettingCard
              key={setting.id}
              setting={setting}
              config={config}
              onUpdate={handleUpdate}
              isSaving={saving === setting.setting_key}
            />
          )
        })}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span>
          How These Settings Work
        </h3>
        <div className="space-y-4 text-sm text-blue-800">
          <div>
            <strong>Product Commission Rate:</strong>
            <p className="ml-4 mt-1">Applied to all product sales. Example: 10% rate on $500 in products = $50 commission</p>
          </div>
          <div>
            <strong>Buffer Time:</strong>
            <p className="ml-4 mt-1">Added to each appointment when calculating staff hours. Example: 5 appointments × 15 min = 75 min (1.25 hours) buffer time</p>
          </div>
          <div>
            <strong>Retention Bonuses:</strong>
            <p className="ml-4 mt-1">
              Staff earn bonuses for repeat customers. Example with defaults:
              <br />• 4 repeat customers = (4 × $50) + $200 extra = $400 total retention bonus
              <br />• 2 repeat customers = (2 × $50) = $100 (no extra since below 3 threshold)
            </p>
          </div>
        </div>
      </div>

      {/* Current Values Summary */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Reference</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {settings.map((setting) => {
            const config = getSettingConfig(setting.setting_key)
            return (
              <div key={setting.id} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{config.icon}</div>
                <div className="font-semibold text-gray-900">
                  {setting.setting_value}
                  {config.unit === '%' ? '%' : config.unit === '$' ? '' : ''}
                  {config.unit === '$' && <span className="text-xs ml-1">USD</span>}
                  {config.unit === 'min' && <span className="text-xs ml-1">min</span>}
                  {config.unit === 'customers' && <span className="text-xs ml-1">customers</span>}
                </div>
                <div className="text-xs text-gray-600 mt-1">{config.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Setting Card Component
function SettingCard({
  setting,
  config,
  onUpdate,
  isSaving
}: {
  setting: PayrollSetting
  config: { label: string; unit: string; icon: string; color: string; info: string }
  onUpdate: (key: string, value: number) => void
  isSaving: boolean
}) {
  const [value, setValue] = useState(setting.setting_value.toString())
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) {
      alert('Please enter a valid positive number')
      setValue(setting.setting_value.toString())
      return
    }
    onUpdate(setting.setting_key, numValue)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setValue(setting.setting_value.toString())
    setIsEditing(false)
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${config.color}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{config.label}</h3>
            <p className="text-xs text-gray-600 mt-1">{config.info}</p>
          </div>
        </div>
      </div>

      {/* Value Display/Edit */}
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <span className="text-sm font-medium text-gray-700 min-w-[60px]">
              {config.unit === '$' ? 'USD' : config.unit}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900">
              {config.unit === '$' && '$'}
              {setting.setting_value}
              {config.unit === '%' && '%'}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {config.unit === 'min' && 'minutes'}
              {config.unit === 'customers' && 'repeat customers'}
              {config.unit === '$' && 'US Dollars'}
              {config.unit === '%' && 'percent'}
            </div>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Edit
          </button>
        </div>
      )}

      {/* Last Updated */}
      {setting.updated_at && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Last updated: {new Date(setting.updated_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
