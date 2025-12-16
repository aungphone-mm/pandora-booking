'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationPreferences {
  sms: boolean
  email: boolean
  push: boolean
  whatsapp: boolean
  marketing: boolean
}

const CHANNEL_COSTS = {
  sms: { cost: '$0.07', description: 'Instant delivery, high reliability' },
  email: { cost: '$0.001', description: 'Very affordable, good delivery' },
  push: { cost: 'Free', description: 'Free for mobile app users' },
  whatsapp: { cost: '$0.03', description: 'Popular in Myanmar, good engagement' },
  marketing: { cost: 'Email only', description: 'Promotional offers and updates' }
}

export default function NotificationPreferences({ userId }: { userId: string }) {
  const supabase = createClient()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    sms: false,
    email: true,
    push: true,
    whatsapp: false,
    marketing: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState(0)

  useEffect(() => {
    loadPreferences()
  }, [userId])

  useEffect(() => {
    calculateEstimatedCost()
  }, [preferences])

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (data) {
        setPreferences({
          sms: data.sms,
          email: data.email,
          push: data.push,
          whatsapp: data.whatsapp,
          marketing: data.marketing
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateEstimatedCost = () => {
    // Estimate monthly notifications per user
    const monthlyEstimate = {
      sms: preferences.sms ? 2 : 0,        // 2 SMS per month (booking + reminder)
      email: preferences.email ? 4 : 0,    // 4 emails per month
      push: preferences.push ? 6 : 0,      // 6 push notifications
      whatsapp: preferences.whatsapp ? 2 : 0, // 2 WhatsApp messages
      marketing: preferences.marketing ? 2 : 0 // 2 marketing emails
    }

    const cost =
      (monthlyEstimate.sms * 0.07) +
      (monthlyEstimate.email * 0.001) +
      (monthlyEstimate.push * 0.0001) +
      (monthlyEstimate.whatsapp * 0.03) +
      (monthlyEstimate.marketing * 0.001)

    setEstimatedCost(cost)
  }

  const savePreferences = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          sms: preferences.sms,
          email: preferences.email,
          push: preferences.push,
          whatsapp: preferences.whatsapp,
          marketing: preferences.marketing,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Notification preferences saved!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (channel: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: value
    }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="flex justify-center items-center min-h-[200px]">
          Loading preferences...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-8 shadow-xl max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Notification Preferences
        </h2>
        <p className="text-gray-500 text-sm">
          Choose how you'd like to receive updates about your appointments
        </p>
      </div>

      {/* Cost Estimate Banner */}
      <div className={`${
        estimatedCost > 0.1 ? 'bg-amber-100 border-amber-400' : 'bg-green-100 border-green-300'
      } border rounded-lg p-4 mb-6`}>
        <div className="flex justify-between items-center">
          <span className={`font-medium ${estimatedCost > 0.1 ? 'text-amber-900' : 'text-green-900'}`}>
            Estimated monthly cost for your preferences:
          </span>
          <span className={`text-xl font-bold ${estimatedCost > 0.1 ? 'text-amber-900' : 'text-green-900'}`}>
            ${estimatedCost.toFixed(3)}
          </span>
        </div>
        <p className={`text-xs mt-1 ${estimatedCost > 0.1 ? 'text-amber-900' : 'text-green-900'}`}>
          {estimatedCost < 0.01 ? '🎉 All your preferences use free/low-cost channels!' :
           estimatedCost < 0.1 ? '💡 Very affordable notification setup' :
           '💰 Consider using email for some notifications to reduce costs'}
        </p>
      </div>

      <div className="flex flex-col gap-5">

        {/* SMS Notifications */}
        <div className={`p-5 border border-gray-200 rounded-lg ${
          preferences.sms ? 'bg-pink-50' : 'bg-gray-50'
        }`}>
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  checked={preferences.sms}
                  onChange={(e) => updatePreference('sms', e.target.checked)}
                  className="w-[18px] h-[18px] cursor-pointer"
                />
                <h3 className="text-lg font-semibold text-gray-900">
                  📱 SMS Notifications
                </h3>
                <span className="bg-red-100 text-red-900 px-2 py-0.5 rounded-xl text-xs font-medium">
                  {CHANNEL_COSTS.sms.cost}/message
                </span>
              </div>
              <p className="text-gray-500 text-sm mb-1">
                {CHANNEL_COSTS.sms.description}
              </p>
              <p className="text-red-600 text-xs font-medium">
                ⚠️ Most expensive option - use for critical notifications only
              </p>
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className={`p-5 border border-gray-200 rounded-lg ${
          preferences.email ? 'bg-blue-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={preferences.email}
              onChange={(e) => updatePreference('email', e.target.checked)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <h3 className="text-lg font-semibold text-gray-900">
              📧 Email Notifications
            </h3>
            <span className="bg-green-100 text-green-900 px-2 py-0.5 rounded-xl text-xs font-medium">
              {CHANNEL_COSTS.email.cost}/message
            </span>
            <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded-xl text-xs font-medium">
              Recommended
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {CHANNEL_COSTS.email.description}
          </p>
        </div>

        {/* Push Notifications */}
        <div className={`p-5 border border-gray-200 rounded-lg ${
          preferences.push ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={preferences.push}
              onChange={(e) => updatePreference('push', e.target.checked)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <h3 className="text-lg font-semibold text-gray-900">
              🔔 Push Notifications
            </h3>
            <span className="bg-green-100 text-green-900 px-2 py-0.5 rounded-xl text-xs font-medium">
              {CHANNEL_COSTS.push.cost}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {CHANNEL_COSTS.push.description}
          </p>
        </div>

        {/* WhatsApp Notifications */}
        <div className={`p-5 border border-gray-200 rounded-lg ${
          preferences.whatsapp ? 'bg-green-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={preferences.whatsapp}
              onChange={(e) => updatePreference('whatsapp', e.target.checked)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <h3 className="text-lg font-semibold text-gray-900">
              💬 WhatsApp Notifications
            </h3>
            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-xl text-xs font-medium">
              {CHANNEL_COSTS.whatsapp.cost}/message
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {CHANNEL_COSTS.whatsapp.description}
          </p>
        </div>

        {/* Marketing Communications */}
        <div className={`p-5 border border-gray-200 rounded-lg ${
          preferences.marketing ? 'bg-blue-50' : 'bg-gray-50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => updatePreference('marketing', e.target.checked)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <h3 className="text-lg font-semibold text-gray-900">
              🎁 Marketing & Promotions
            </h3>
            <span className="bg-green-100 text-green-900 px-2 py-0.5 rounded-xl text-xs font-medium">
              {CHANNEL_COSTS.marketing.cost}
            </span>
          </div>
          <p className="text-gray-500 text-sm">
            {CHANNEL_COSTS.marketing.description}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8">
        <button
          onClick={savePreferences}
          disabled={saving}
          className={`w-full py-3 px-6 rounded-lg border-none font-semibold text-base transition-all duration-200 ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-pink-500 hover:bg-pink-600 cursor-pointer hover:shadow-lg'
          } text-white`}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-100 rounded-md">
        <p className="text-gray-500 text-xs text-center leading-snug">
          💡 <strong>Pro tip:</strong> Enable email and push notifications for the best
          experience at low cost. SMS is great for critical updates but costs more.
        </p>
      </div>
    </div>
  )
}
