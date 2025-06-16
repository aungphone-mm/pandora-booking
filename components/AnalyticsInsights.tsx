'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Insight {
  id: string
  type: 'info' | 'warning' | 'success' | 'alert'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high'
  actionable?: boolean
  createdAt: Date
}

export function AnalyticsInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    generateInsights()
  }, [])

  const generateInsights = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Fetch today's data
      const { data: todayData } = await supabase
        .from('appointments')
        .select('*, services(price)')
        .eq('appointment_date', today)

      // Fetch yesterday's data for comparison
      const { data: yesterdayData } = await supabase
        .from('appointments')
        .select('*, services(price)')
        .eq('appointment_date', yesterday)

      // Fetch pending appointments
      const { data: pendingData } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'pending')
        .gte('appointment_date', today)

      // Fetch recent cancellations
      const { data: cancellationData } = await supabase
        .from('appointments')
        .select('*')
        .in('status', ['cancelled', 'no_show'])
        .gte('appointment_date', lastWeek)

      const generatedInsights: Insight[] = []

      // Revenue comparison insight
      const todayRevenue = todayData?.reduce((sum, apt) => sum + (apt.services?.price || 0), 0) || 0
      const yesterdayRevenue = yesterdayData?.reduce((sum, apt) => sum + (apt.services?.price || 0), 0) || 0
      
      if (todayRevenue > yesterdayRevenue * 1.2) {
        generatedInsights.push({
          id: 'revenue-up',
          type: 'success',
          title: 'Revenue Surge!',
          message: `Today's revenue is ${Math.round((todayRevenue / yesterdayRevenue - 1) * 100)}% higher than yesterday`,
          priority: 'medium',
          createdAt: new Date()
        })
      } else if (todayRevenue < yesterdayRevenue * 0.8) {
        generatedInsights.push({
          id: 'revenue-down',
          type: 'warning',
          title: 'Revenue Below Average',
          message: `Today's revenue is ${Math.round((1 - todayRevenue / yesterdayRevenue) * 100)}% lower than yesterday`,
          priority: 'high',
          actionable: true,
          createdAt: new Date()
        })
      }

      // Pending appointments insight
      const pendingCount = pendingData?.length || 0
      if (pendingCount > 5) {
        generatedInsights.push({
          id: 'pending-high',
          type: 'alert',
          title: 'High Pending Appointments',
          message: `${pendingCount} appointments need confirmation`,
          priority: 'high',
          actionable: true,
          createdAt: new Date()
        })
      }

      // Cancellation rate insight
      const cancellationCount = cancellationData?.length || 0
      if (cancellationCount > 10) {
        generatedInsights.push({
          id: 'cancellation-high',
          type: 'warning',
          title: 'High Cancellation Rate',
          message: `${cancellationCount} cancellations this week - consider implementing reminder system`,
          priority: 'medium',
          actionable: true,
          createdAt: new Date()
        })
      }

      // Capacity insight
      const todayBookings = todayData?.filter(apt => apt.status === 'confirmed').length || 0
      if (todayBookings < 10) {
        generatedInsights.push({
          id: 'low-bookings',
          type: 'info',
          title: 'Low Booking Day',
          message: 'Consider promoting services on social media or sending special offers',
          priority: 'low',
          actionable: true,
          createdAt: new Date()
        })
      } else if (todayBookings > 25) {
        generatedInsights.push({
          id: 'high-bookings',
          type: 'success',
          title: 'Busy Day Ahead!',
          message: 'High booking volume - ensure adequate staffing',
          priority: 'medium',
          createdAt: new Date()
        })
      }

      setInsights(generatedInsights)
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const dismissInsight = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
  }

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success': return '🎉'
      case 'warning': return '⚠️'
      case 'alert': return '🚨'
      default: return '💡'
    }
  }

  const getInsightColors = (type: Insight['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'alert': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const visibleInsights = insights.filter(insight => !dismissed.has(insight.id))

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-500"></div>
          <span className="text-gray-600">Analyzing business insights...</span>
        </div>
      </div>
    )
  }

  if (visibleInsights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="text-4xl mb-3">✨</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Looking Good!</h3>
        <p className="text-gray-600">No critical insights at the moment. Keep up the great work!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Business Insights</h3>
        <button
          onClick={generateInsights}
          className="text-sm text-pink-600 hover:text-pink-700 font-medium"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {visibleInsights
          .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            return priorityOrder[b.priority] - priorityOrder[a.priority]
          })
          .map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColors(insight.type)} relative`}
            >
              <button
                onClick={() => dismissInsight(insight.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
              
              <div className="flex items-start space-x-3 pr-6">
                <span className="text-xl">{getInsightIcon(insight.type)}</span>
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{insight.title}</h4>
                  <p className="text-sm opacity-80 mb-2">{insight.message}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${ 
                      insight.priority === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : insight.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {insight.priority} priority
                    </span>
                    
                    {insight.actionable && (
                      <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                        Actionable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="text-lg mb-1">📧</div>
          <div className="text-sm font-medium text-gray-900">Send Reminders</div>
          <div className="text-xs text-gray-500">To pending appointments</div>
        </button>
        
        <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="text-lg mb-1">🎯</div>
          <div className="text-sm font-medium text-gray-900">Create Promotion</div>
          <div className="text-xs text-gray-500">Boost slow days</div>
        </button>
        
        <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="text-lg mb-1">📊</div>
          <div className="text-sm font-medium text-gray-900">View Reports</div>
          <div className="text-xs text-gray-500">Detailed analytics</div>
        </button>
        
        <button className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="text-lg mb-1">⚙️</div>
          <div className="text-sm font-medium text-gray-900">Settings</div>
          <div className="text-xs text-gray-500">Business configuration</div>
        </button>
      </div>
    </div>
  )
}