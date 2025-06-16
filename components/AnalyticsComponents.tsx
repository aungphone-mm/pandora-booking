'use client'

import React from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: string
  change?: {
    value: number
    isPositive: boolean
  }
  color: 'green' | 'blue' | 'purple' | 'orange' | 'pink'
}

export function MetricCard({ title, value, icon, change, color }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <span className="text-white text-xl">{icon}</span>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {change && (
          <div className={`text-sm font-medium ${
            change.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.isPositive ? '↗' : '↘'} {Math.abs(change.value)}%
          </div>
        )}
      </div>
    </div>
  )
}

interface ChartBarProps {
  data: Array<{ label: string; value: number; color?: string }>
  height?: number
}

export function SimpleBarChart({ data, height = 200 }: ChartBarProps) {
  const maxValue = Math.max(...data.map(item => item.value))
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        
        return (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-24 text-sm font-medium text-gray-700 truncate">
              {item.label}
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    item.color || 'bg-pink-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="w-16 text-sm text-gray-600 text-right">
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}

export function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  color = '#ec4899' 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

interface TimelineItemProps {
  time: string
  title: string
  description: string
  status: 'completed' | 'pending' | 'cancelled'
}

export function TimelineItem({ time, title, description, status }: TimelineItemProps) {
  const statusColors = {
    completed: 'bg-green-500',
    pending: 'bg-yellow-500',
    cancelled: 'bg-red-500'
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]} mt-1.5`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-500">{description}</div>
        <div className="text-xs text-gray-400 mt-1">{time}</div>
      </div>
    </div>
  )
}

interface TableProps {
  headers: string[]
  data: Array<Array<string | number>>
  className?: string
}

export function SimpleTable({ headers, data, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export function StatCard({ label, value, sublabel, trend, trendValue }: StatCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {sublabel && (
        <div className="text-xs text-gray-500 mt-1">{sublabel}</div>
      )}
      {trend && trendValue && (
        <div className={`text-xs mt-2 ${trendColors[trend]}`}>
          {trendIcons[trend]} {trendValue}
        </div>
      )}
    </div>
  )
}