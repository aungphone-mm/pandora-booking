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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px'
        }}>
          Loading preferences...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '8px'
        }}>
          Notification Preferences
        </h2>
        <p style={{
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          Choose how you'd like to receive updates about your appointments
        </p>
      </div>

      {/* Cost Estimate Banner */}
      <div style={{
        backgroundColor: estimatedCost > 0.1 ? '#fef3c7' : '#dcfce7',
        border: `1px solid ${estimatedCost > 0.1 ? '#fbbf24' : '#86efac'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            color: estimatedCost > 0.1 ? '#92400e' : '#166534',
            fontWeight: '500'
          }}>
            Estimated monthly cost for your preferences:
          </span>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: estimatedCost > 0.1 ? '#92400e' : '#166534'
          }}>
            ${estimatedCost.toFixed(3)}
          </span>
        </div>
        <p style={{
          color: estimatedCost > 0.1 ? '#92400e' : '#166534',
          fontSize: '0.75rem',
          marginTop: '4px'
        }}>
          {estimatedCost < 0.01 ? '🎉 All your preferences use free/low-cost channels!' :
           estimatedCost < 0.1 ? '💡 Very affordable notification setup' :
           '💰 Consider using email for some notifications to reduce costs'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* SMS Notifications */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: preferences.sms ? '#fef2f8' : '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={preferences.sms}
                  onChange={(e) => updatePreference('sms', e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px'
                  }}
                />
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  📱 SMS Notifications
                </h3>
                <span style={{
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {CHANNEL_COSTS.sms.cost}/message
                </span>
              </div>
              <p style={{
                color: '#6b7280',
                fontSize: '0.875rem',
                marginBottom: '4px'
              }}>
                {CHANNEL_COSTS.sms.description}
              </p>
              <p style={{
                color: '#dc2626',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                ⚠️ Most expensive option - use for critical notifications only
              </p>
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: preferences.email ? '#f0f9ff' : '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <input
              type="checkbox"
              checked={preferences.email}
              onChange={(e) => updatePreference('email', e.target.checked)}
              style={{
                width: '18px',
                height: '18px'
              }}
            />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              📧 Email Notifications
            </h3>
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              {CHANNEL_COSTS.email.cost}/message
            </span>
            <span style={{
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              Recommended
            </span>
          </div>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {CHANNEL_COSTS.email.description}
          </p>
        </div>

        {/* Push Notifications */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: preferences.push ? '#f0fdf4' : '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <input
              type="checkbox"
              checked={preferences.push}
              onChange={(e) => updatePreference('push', e.target.checked)}
              style={{
                width: '18px',
                height: '18px'
              }}
            />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              🔔 Push Notifications
            </h3>
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              {CHANNEL_COSTS.push.cost}
            </span>
          </div>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {CHANNEL_COSTS.push.description}
          </p>
        </div>

        {/* WhatsApp Notifications */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: preferences.whatsapp ? '#f0fdf4' : '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <input
              type="checkbox"
              checked={preferences.whatsapp}
              onChange={(e) => updatePreference('whatsapp', e.target.checked)}
              style={{
                width: '18px',
                height: '18px'
              }}
            />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              💬 WhatsApp Notifications
            </h3>
            <span style={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              {CHANNEL_COSTS.whatsapp.cost}/message
            </span>
          </div>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {CHANNEL_COSTS.whatsapp.description}
          </p>
        </div>

        {/* Marketing Communications */}
        <div style={{
          padding: '20px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          backgroundColor: preferences.marketing ? '#f0f9ff' : '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '8px'
          }}>
            <input
              type="checkbox"
              checked={preferences.marketing}
              onChange={(e) => updatePreference('marketing', e.target.checked)}
              style={{
                width: '18px',
                height: '18px'
              }}
            />
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827'
            }}>
              🎁 Marketing & Promotions
            </h3>
            <span style={{
              backgroundColor: '#dcfce7',
              color: '#166534',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500'
            }}>
              {CHANNEL_COSTS.marketing.cost}
            </span>
          </div>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {CHANNEL_COSTS.marketing.description}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '32px' }}>
        <button
          onClick={savePreferences}
          disabled={saving}
          style={{
            width: '100%',
            backgroundColor: saving ? '#9ca3af' : '#ec4899',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '1rem'
          }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Help Text */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px'
      }}>
        <p style={{
          color: '#6b7280',
          fontSize: '0.75rem',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          💡 <strong>Pro tip:</strong> Enable email and push notifications for the best 
          experience at low cost. SMS is great for critical updates but costs more.
        </p>
      </div>
    </div>
  )
}
